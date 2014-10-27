(function(define, requirejs) {
    'use strict';
    define([
        ],
        function () {
            /**
             * @brief load class by path and invoke it
             * @details it is good to use in resolve service of routes
             * 
             * @param  [description]
             * @return [description]
             */
            function resolveUrl(path) {
                autoloadClass.$inject = ['$q', '$injector'];
                function autoloadClass($q, $injector) {
                    var dfd = $q.defer(),
                        self = this;
                    requirejs([path], function (classModule) {
                        var invValue = $injector.invoke(classModule, self);
                        $q.when(invValue)
                            .then(function (result) {
                                dfd.resolve(result);
                            }, function (err) {
                                dfd.reject(result);
                            });
                    });
                    return dfd.promise;
                }
                return autoloadClass;
            }
            function resolveUrlWithoutInvoke(path) {
                autoloadClass.$inject = ['$q'];
                function autoloadClass($q) {
                    var dfd = $q.defer();
                    requirejs([path], function (moduleClass) {
                        dfd.resolve(moduleClass);
                    });
                    return dfd.promise;
                }
                return autoloadClass;
            }
            
            return {
                // resolve wihtout invoke(execute) URL
                resolveUrlWithoutInvoke: resolveUrlWithoutInvoke,
                // resolve with invoke URL
                resolveUrl: resolveUrl
            };
    });
}(define, requirejs));
    