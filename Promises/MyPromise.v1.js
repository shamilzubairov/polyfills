function MyPromise () {
  let promiseCallback = arguments[0]

  if(typeof promiseCallback !== 'function') {
    throw new Error("Resolver undefined is not a function")
  }

  // для статических свойств используется constructor
  
  this.PromiseStatus = "pending"
  this.PromiseValue = undefined

  let ThenableResolved = []
  let ThenableRejected = []
  let ThenableFinally = []

  let unRejectedErr = false 

  const resolve = function(value) {
    queueMicrotask(() => {
      if(this.PromiseStatus === "pending") {
        this.PromiseStatus = "resolved"
        this.PromiseValue = value
        
        if(ThenableResolved.length) {
          ThenableRun(ThenableResolved)
        }
      }
    })
  }.bind(this)

  const reject = function(value) {
    queueMicrotask(() => {
      if(this.PromiseStatus === "pending") {
        this.PromiseStatus = "rejected"
        this.PromiseValue = value
        unRejectedErr = true
        
        if(ThenableRejected.length) {
          ThenableRun(ThenableRejected)
        }
        if(unRejectedErr) {
          throw new Error(this.PromiseValue)
        }
      }
    })
  }.bind(this)

  const ThenableRun = function(ThenableMap) {
    ThenableMap.reduce((prevValue, then) => {
      try {
        this.PromiseValue = then(prevValue)
      } catch(e) {
        this.PromiseValue = e
        if(ThenableRejected.length) {
          ThenableRun(ThenableRejected)
        } else {
          this.PromiseStatus = "rejected"
          throw new Error(this.PromiseValue)
        }
      }
      return this.PromiseValue
    }, this.PromiseValue)

    if(this.PromiseStatus === "resolved") {
      ThenableResolved = []
    } else if(this.PromiseStatus === "rejected") {
      ThenableRejected = []
      this.PromiseStatus = "resolved"
      unRejectedErr = false
    }
  }.bind(this)

  MyPromise.prototype.then = function(onResolve, onReject) {
    if(onResolve) ThenableResolved.push(onResolve)
    if(onReject) ThenableRejected.push(onReject)
    return this
  }
  MyPromise.prototype.catch = function(onReject) {
    if(onReject) ThenableRejected.push(onReject)
    return this
  }
  MyPromise.prototype.finally = function(onFinally) {
    if(onFinally) ThenableFinally.push(onFinally)
    return this
  }

  MyPromise.prototype[Symbol.toStringTag] = 'MyPromise'

  promiseCallback(resolve, reject)
}

// Promise.all
// Promise.race

var promise = new MyPromise((resolve, reject) => {
  console.log(123);
  setTimeout(() => {
    resolve("result1");
  }, 2000);
  console.log(456);
});

promise
  .then(
    result => {
      console.log("Fulfilled: " + result);
      return "next then";
    },
    error => {
      console.log("Rejected: " + error);
    }
  )
  .then(
    result => {
      console.log("Fulfilled: " + result);
    },
    error => {
      console.log("Rejected: " + error);
    }
  );