define([], function () {
    "use strict";
    // Only
    function resolveUrlWithoutInvoke(path) {
        autoloadClass.$inject = ['$q'];
        function autoloadClass($q) {
            var dfd = $q.defer();
            require(path, function (module) {
                dfd.resolve(result);
            });
            return dfd.promise;
        }
        return autoloadClass;
    }
    function resolveUrl(path) {
        autoloadClass.$inject = ['$scope', '$q', '$injector'];
        function autoloadClass($scope, $q, $injector) {
            var dfd = $q.defer();
            require(path, function (module) {
                $q.when($injector.invoke(module, this, {'$scope', $scope})).then(function (result) {
                    dfd.resolve(result);
                }, function (err) {
                    dfd.reject(result);
                });
            });
            return dfd.promise;
        }
        return autoloadClass;
    }
    
    return {
        // resolve wihtout invoke(execute) URL
        resolveUrlWithoutInvoke: resolveUrlWithoutInvoke,
        // resolve with invoke URL
        resolveUrl: resolveUrl;
    }
});