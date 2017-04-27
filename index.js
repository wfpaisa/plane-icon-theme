"use strict";

/**
 * Run objects async
 *
 * @param      {obj}    objectAsync  objec to async
 * @param      {Function}  runfunction  the function to run : ( key,data,cb(err,resolve) )
 * @param      {Function}  callback     finish callback
 * 
 * Example:
 * 
 * objAsync(obj, function(key,data,cb){
 *      var time = key=='key4'? 8000: 2000;
 *      setTimeout(function(){
 *          console.log(`${key}: ${data}`);
 *          cb(null, key);
 *      },time)
 * },function(err, resolve){
 *      console.log('last:',resolve)
 * })
 *
 */
function objAsync(objectAsync, runfunction, callback) {

    var count = Object.keys(objectAsync).length;

    // loop async
    function loopasync(cb) {

        for (const key in objectAsync) {

            runfunction(key, objectAsync[key], function(err, resolve) {
                if (err) return callback(err)

                cb(null, resolve)
            })

        }

    }

    // Check all async
    loopasync(function(err, resolve) {

        if (err) return callback(err);

        // total of objects
        count--;

        // When it is equal to 0 is because all callbacks have returned
        if (count === 0) callback(null, resolve)
    })
}



// Example

var obj = {
    key1: 'uno',
    key2: 'dos',
    key3: 'tres',
    key4: 'cuatro'
}

objAsync(obj, function(key, data, cb) {

    var time = key == 'key4' ? 8000 : 2000;

    setTimeout(function() {

        console.log(`${key}: ${data}`);

        cb(null, key);

    }, time)



}, function(err, resolve) {
    
    if(err) console.log(err);

    console.log('last:', resolve)
})