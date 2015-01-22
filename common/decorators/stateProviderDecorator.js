// state decorator to process controllerUrl (will be loaded at first requested time), 
// To enable add it to app.config:
// e.g.:
// define(['stateProviderDecorator'], function(stateProviderDecorator) {
//      'use strict';
//      var app = angular.module('myApp', ['$stateProvider']);
//      app.config(stateProviderDecorator);
// });
//
// then it is possible to use templateUrl:
// app.config(['$stateProvider', function($stateProvider) {
//      $stateProvider.state('state1', {
//          url: '/path1',
//          controllerUrl: 'require/js/module/path',
//          templateUrl: 'partial/path'
//      });
//      // or views
//      $stateProvider.state('state1', {
//          url: '/path1',
//          views: {
//              'view1': {
//                  controllerUrl: 'require/js/module/path',
//                  templateUrl: 'partial/path'
//              },
//              'view2': {
//                  controllerUrl: 'require/js/module/path2',
//                  templateUrl: 'partial/path2'
//              }
//          }
//      });
// }])
(function (define) {
    "use strict";
    define([
            'common/utils/amdUtils'
        ], function (amdUtils) {

        function processControllerUrl(options, resolve, settings) {
            if(!options.hasOwnProperty('controllerUrl')) {
                return;
            }
            
            if(typeof options.controllerUrl !== 'string') {
                throw Error("controllerUrl should be string instead of " + typeof(options.controllerUrl));
            }

            if(options.hasOwnProperty('controller')) {
                throw Error('Cannot be used both propoertes: controller and controllerUrl (' + options.controllerUrl + ')');
            }
            
            settings.index += 1;
            var controllerUrl = options.controllerUrl,
                resolveControllerName = '__resolveControllerUrl' + (settings.index) + '__',
                self = this,
                parentcontrollerCb = function ($scope, controllerCb, $injector) {
                    //TODO: check proper implicit Array DI
                    if(!controllerCb || !((typeof(controllerCb) == 'function') || (controllerCb instanceof Array))) {
                        throw Error('controller URL '+controllerUrl+' did not return an invokable function');
                    }
                    var resolveController = {};
                    // add local resolve
                    for(var i = 0; i < settings.resolveNames.length; ++i) {
                        var depName = settings.resolveNames[i];
                        resolveController[depName] = arguments[i+3];
                    }
                    resolveController.$scope = $scope;
                    $injector.invoke(controllerCb, self, resolveController);
                };
            resolve[resolveControllerName] = amdUtils.resolveUrlWithoutInvoke(controllerUrl);
            parentcontrollerCb.$inject = ['$scope', resolveControllerName, '$injector'];
            //TODO: to use direct resolve di
            // for now make all resoles as dependencies
            for(var i = 0; i < settings.resolveNames.length; ++i) {
                parentcontrollerCb.$inject.push(settings.resolveNames[i]);
            }
            options.controller = parentcontrollerCb;
            // cleanup
            delete options.controllerUrl;
        }
        
        decorateStateProvider.$inject = ['$stateProvider'];
        function decorateStateProvider($stateProvider) {
            var origState = $stateProvider.state;

            $stateProvider.state = function (name, options) {
                var stateSettings = {
                        index: 0,
                        resolveNames: []
                    };
                if(!options) {
                    options = name;
                } else {
                    options.name = name;
                }

                if(typeof(options) === 'string') {
                    options = {
                        resolve: {},
                        templateUrl: options + '.html',
                        controllerUrl: options + '.js'
                    }
                } else if(!options.resolve) {
                    options.resolve = {};
                }

                stateSettings.resolveNames = Object.keys(options.resolve);
                processControllerUrl(options, options.resolve, stateSettings);
                
                if(options.views) {
                    for(var key in options.views) {
                        var view = options.views[key];
                        if(typeof(view) === 'string') {
                            view = options.views[key] = {
                                templateUrl: view + '.html',
                                controllerUrl: view + '.js'
                            };
                        }
                        processControllerUrl(view, options.resolve, stateSettings);
                    }
                }
                return origState.call($stateProvider, options);
            }
        }
        
        decorateRouteProvider.$inject = ['$routeProvider'];
        function decorateRouteProvider($routeProvider) {
            var origWhen = $routeProvider.when;

            $routeProvider.when = function(url, options) {
                var stateSettings = {
                        index: 0,
                        resolveNames: []
                    };

                if(typeof(options) === 'string') {
                    options = {
                        resolve: {},
                        templateUrl: options + '.html',
                        controllerUrl: options + '.js'
                    }
                } else if(!options.resolve) {
                    options.resolve = {};
                }
                stateSettings.resolveNames = Object.keys(options.resolve);
                processControllerUrl(options, options.resolve, stateSettings);
                return origWhen.call($routeProvider, url, options);
            }
        }

        decorateStateAndRouteProvider.$inject = ['$injector']
        function decorateStateAndRouteProvider($injector) {
            if($injector.has("$stateProvider")) {
                $injector.invoke(decorateStateProvider, this);
            }

            if($injector.has("$routeProvider")) {
                $injector.invoke(decorateRouteProvider, this);
            }
        }

        return decorateStateAndRouteProvider;
    });
}(define));