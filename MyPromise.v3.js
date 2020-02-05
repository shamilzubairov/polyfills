function MyPromise () {
    const promiseCallback = arguments[0]
    if(typeof promiseCallback !== 'function') {
      throw new Error('Resolver undefined is not a function')
    }
    this.PromiseStatus = 'pending'
    this.PromiseValue
  
    let unRejectedErr = false
    let thenableQueue = []
    let isExecutedResolve = false
    let isExecutedReject = false
    let firstValue
  
    const resolve = function(value) {
      isExecutedResolve = true
      if(thenableQueue.length === 0) {
        firstValue = value
        return
      }
      this.PromiseStatus = 'resolved'
      this.PromiseValue = firstValue = value
      onThenableResolve(thenableQueue)
    }.bind(this)
    
    const reject = function(value) {
      if(this.PromiseStatus === 'pending') {
        this.PromiseStatus = 'rejected'
        this.PromiseValue = value
        unRejectedErr = true
        onThenableReject(thenableQueue)
        onThenableResolve(thenableQueue)
        if(unRejectedErr) {
          throw new Error(this.PromiseValue)
        }
      }
    }.bind(this)
  
    const onThenableResolve = function(thenableQueue) {
      while(thenableQueue.length) {
        let thenableObj = thenableQueue.shift()
        while(!thenableObj.hasOwnProperty('then')) {
          if(thenableObj.hasOwnProperty('finally')) thenableObj.finally()
          if(thenableQueue.length === 0) return
          thenableObj = thenableQueue.shift()
        }
        try {
          this.PromiseValue = thenableObj.then(this.PromiseValue)
          if(thenableObj.hasOwnProperty('finally')) thenableObj.finally()
        } catch(e) {
          this.PromiseValue = e
          onThenableReject(thenableQueue)
        }
      }
    }.bind(this)
  
    const onThenableReject = function(thenableQueue) {
      if(thenableQueue.length === 0) return
      let thenableObj = thenableQueue.shift()
      while(!thenableObj.hasOwnProperty('catch')) {
        if(thenableObj.hasOwnProperty('finally')) thenableObj.finally()
        if(thenableQueue.length === 0) {
          this.PromiseStatus = 'rejected'
          throw new Error(this.PromiseValue)
        }
        thenableObj = thenableQueue.shift()
      }
      this.PromiseValue = thenableObj.catch(this.PromiseValue)
      this.PromiseStatus = 'resolved'
      unRejectedErr = false
    }.bind(this)
  
    MyPromise.prototype.then = function() {
      if(isExecutedResolve) {
        queueMicrotask(() => {
          resolve(firstValue)
        })
      }
      let onResolve, onReject
      if((onResolve = arguments[0])) thenableQueue.push({then: onResolve})
      if((onReject = arguments[1])) thenableQueue.push({catch: onReject})
      return this
    }
    MyPromise.prototype.catch = function() {
      let onReject
      if((onReject = arguments[0])) thenableQueue.push({catch: onReject})
      return this
    }
    MyPromise.prototype.finally = function() {
      let onFinally
      if((onFinally = arguments[0])) thenableQueue.push({finally: onFinally})
      return this
    }
    MyPromise.prototype[Symbol.toStringTag] = 'MyPromise'
  
    queueMicrotask(() => {
      try {
        promiseCallback(resolve, reject)
      } catch(e) {
        this.PromiseValue = e
        reject(this.PromiseValue)
      }
    })
  
  }