
    var forEachPair = (arr, iteratee) => {
        if (_.isFunction(iteratee)) { throw `Invalid argument iteratte must be a function.`; }
        
        if (_.isArray(arr)) { throw `Invalid argument arr must be an array`; }

        var aux = isEven(arr.length) ? _.merge([], arr) : _.concat(_.merge([], arr), [undefined]);
        for (var i = 0; i < aux.length; i += 2) {
            iteratee.call(window, aux[i], aux[i + 1]);
        }
    };

    forEachPair([1, 2, 3], (a, b) => console.log(`${a} - ${b}`));