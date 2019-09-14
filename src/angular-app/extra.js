
const _ = require('lodash');

alertify.defaults.transition = "zoom";

alertify.loadingDialog || alertify.dialog('loadingDialog',function(){
    return {
        main:function(){

            let content = '';
            htmlLoading = '<span class="lnr lnr-sync rotate"></span>&nbsp;';

            if (arguments.length > 1) {
                arguments[0] && this.setHeader(arguments[0]);
                content = arguments[1];
                arguments[2] && this.set(arguments[2]);
            }
            else {
                this.setHeader('Processando');
                content = arguments[0];
            }

            let html = `<div class="row">
                        <div class="col-2">
                            <span class="lnr lnr-sync rotating" style="font-size: 40px;"></span>
                        </div>
                        <div class="col-10 align-middle" style="line-height: 36px;">${content}</div>
                        </div>`;
            this.setContent(html);
        },
        setup:function(){
            return {
                options:{
                    maximizable:false,
                    resizable:false,
                    closable: false,
                    movable: false
                }
            };
        },
    };
});





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