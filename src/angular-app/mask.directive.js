angular.module("App").directive("mask", ["$parse", function(n) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(t, i, r, u) {
            i.data("mask") || (i.mask(r.mask, !!n(r.maskReverse)(t)),
            t.$on("$destroy", function() {
                i.unmask()
            }),
            r.maskNoParse) || (u.$parsers = [],
            u.$parsers.push(function() {
                if (i.data("mask"))
                    return i.cleanVal()
            }),
            u.$formatters.push(function(n) {
                if (i.data("mask"))
                    return n ? i.masked(n) : n
            }))
        }
    }
}
])