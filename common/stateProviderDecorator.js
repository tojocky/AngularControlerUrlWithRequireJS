define(['common/utils/amdUtils'], function (amdUtils) {
    "use strict";

    function processControllerUrl(parentObject, resolver, settings) {
        if(!options.hasOwnProperty('controllerUrl')) {
            return;
        }
        
        if(typeof options.controllerUrl !== 'string') {
            throw Error("controllerUrl should be string instead of " + typeof(options.controllerUrl));
        }

        if(options.hasOwnProperty('controller')) {
            throw Error('Cannot be used both propoertes: controller and controllerUrl (' + options.controllerUrl + ')');
        }
        var controllerUrl = options.controllerUrl,
            resolveControllerName = '__resolveControllerUrl' + (settings.index++) + '__';
        delete options.controllerUrl;
        resolve[resolveControllerName] = amdUtils.resolveUrlWithoutInvoke(controllerUrl);
        parentObject.controller = [
            '$scope', resolveControllerName, '$injector',
            function ($scope, controllerCb, $injector) {
                $injector.invoke(controllerCb, this, { '$scope': $scope });
            }];
    }
    
    decorateMethodState.$inject = ['$delegate', '$debug'];
    function decorateMethodState($delegate, $debug) {
        var originalState = $delegate.state;
        $delegate.state = function (name, options) {
            var stateSettings = {
                    index: 0;
                };

            if(!options) {
                options = name;
            } else {
                options.name = name;
            }

            if(!options.resolve) {
                options.resolve = {};
            }

            processControllerUrl(options, options.resolve, stateSettings);
            
            if(options.views) {
                for(key in options.views) {
                    var view = options.views[key];
                    processControllerUrl(view, options.resolve, stateSettings);
                }
            }
            return originalState(options);
        }
    }

    // main state decorator to process controllerUrl
    // add it to app config:
    // e.g.:
    // define(['stateProviderDecorator'], function(stateProviderDecorator) {
    //      'use strict';
    //      var app = angular.module('myApp', ['$stateProvider']);
    //      app.config(stateProviderDecorator);
    // });
    //
    // then use:
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
    stateProviderDecorator.$inject = ['$provide'];
    function stateProviderDecorator ($provide) {
        $provide.decorate('$stateProvider', decorateMethodState);
    }
    
    return stateProviderDecorator;
});