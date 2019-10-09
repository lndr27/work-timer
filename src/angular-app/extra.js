
const _ = require('lodash');

/* PROMISE FINALLY POLYFILL */
(function() {
	// Get a handle on the global object
	var local;
	if (typeof global !== 'undefined') local = global;
	else if (typeof window !== 'undefined' && window.document) local = window;
	else local = self;

	// It's replaced unconditionally to preserve the expected behavior
	// in programs even if there's ever a native finally.
	local.Promise.prototype['finally'] = function finallyPolyfill(callback) {
		var constructor = this.constructor;

		return this.then(function(value) {
				return constructor.resolve(callback()).then(function() {
					return value;
				});
			}, function(reason) {
				return constructor.resolve(callback()).then(function() {
					throw reason;
				});
			});
    };   

    local.forEachPair = (arr, iteratee) => {
        if (!_.isFunction(iteratee)) { throw `Invalid argument iteratte must be a function.`; }        
        if (!_.isArray(arr)) { throw `Invalida argument arr must be an array`; }

        var aux = isEven(arr.length) ? _.merge([], arr) : _.concat(_.merge([], arr), [undefined]);
        for (var i = 0; i < aux.length; i += 2) {
            iteratee.call(window, aux[i], aux[i + 1]);
        }
    };

    local.isEven = (num) => (num % 2) === 0;

    local.milisToMinutes = (milis) => Math.floor(milis / 1000 / 60);

}());