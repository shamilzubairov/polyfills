function MyPromise () {
    const promiseCallback = arguments[0]
    if(typeof promiseCallback !== 'function') {
      throw new Error("Resolver undefined is not a function")
    }
    this.PromiseStatus = "pending"
    this.PromiseValue = undefined
    let unRejectedErr = false
    let thenableQueue = []

    const resolve = function(value) {
      if(this.PromiseStatus === "pending") {
        this.PromiseStatus = "resolved"
        this.PromiseValue = value
        onThenableResolve(thenableQueue)
      }
    }.bind(this)
  
    const reject = function(value) {
      if(this.PromiseStatus === "pending") {
        this.PromiseStatus = "rejected"
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
          this.PromiseStatus = "rejected"
          throw new Error(this.PromiseValue)
        }
        thenableObj = thenableQueue.shift()
      }
      this.PromiseValue = thenableObj.catch(this.PromiseValue)
      this.PromiseStatus = "resolved"
      unRejectedErr = false
    }.bind(this)

    MyPromise.prototype.then = function() {
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

    const run = function () {
      queueMicrotask(() => {
        try {
          promiseCallback(resolve, reject)
        } catch(e) {
          this.PromiseValue = e
          reject(this.PromiseValue)
        }
      })
    }.bind(this)

    run()
  }

  MyPromise.resolve = function() {
    
  }
  MyPromise.reject = function() {

  }
  MyPromise.all = function() {

  }
  MyPromise.race = function() {

  }
  MyPromise.allSettled = function() {

  }

  var promise = new MyPromise((res, rej)=>{
    console.log('-------before-------')
    setTimeout(()=>res('####### RUN- #######'), 5000)
    console.log('-------after-------')
  })
  
  promise
    .then(r=>console.log(r, '-FIRST RUN IN THEN'))
    .catch(e=>console.log(e, 'ERR--1'))
    .catch(e=>console.log(e, 'ERR--2'))
    .then(r=>{
        console.log(r, 'Error throwing in THEN')
        throw new Error('Error throwing from THEN!!!')
    })
    .then(r=>console.log(r, 'THEN--1 (After Error THEN)'))
    .then(r=>console.log(r, 'THEN--2'))
    .finally(()=>console.log('...FINALLY--1'))
    .catch(e=>console.log(e, 'ERR--3'))
    .then(r=>console.log(r, 'THEN--3'))
    .finally(()=>console.log('...FINALLY--2'))
    .catch(e=>console.log(e, 'ERR--4'))
    .finally(()=>console.log('...FINALLY--3'))
    .catch(e=>console.log(e, 'ERR--5'))
    .then(r=>console.log(r, 'THEN--4'))
    .then(r=>console.log(r, 'THEN--5'))
    .then(r=>console.log('final ...THEN--6'))
    .finally(()=>console.log('final ...FINALLY--4'))
  
    /* Console...
  
    -------before-------
    -------after-------
    MyPromise {PromiseStatus: "pending", PromiseValue: undefined}
  =========
  1 sec....
  =========
    ####### RUN- ####### -FIRST RUN IN THEN
    undefined "Error throwing in THEN"
    ...FINALLY--1
    Error: Error throwing from THEN!!!
        at Object.then (<anonymous>:11:13)
        at MyPromise.<anonymous> (<anonymous>:45:43)
        at <anonymous>:16:11 "ERR--3"
    undefined "THEN--3"
    ...FINALLY--2
    ...FINALLY--3
    undefined "THEN--4"
    undefined "THEN--5"
    final ...THEN--6
    final ...FINALLY--4
  
    */