/* Copyright start
    MIT License
    Copyright (c) 2025 Fortinet Inc
Copyright end */
'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editCustomTags110Ctrl', editCustomTags110Ctrl);

    editCustomTags110Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'widgetUtilityService', '$timeout', 'appModulesService', 'Entity'];

    function editCustomTags110Ctrl($scope, $uibModalInstance, config, widgetUtilityService, $timeout, appModulesService, Entity) {
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.includeMoreTags = includeMoreTags;
        $scope.removeLayer = removeLayer;
        $scope.config = config;
        $scope.isConfigurable = false;
        $scope.structureSupported = ['Card','Tag','URL'];
        $scope.config.includedTagsStructure = [{
              structureSelected: '',
              field: ''
          }];
        function _handleTranslations() {
          let widgetNameVersion = widgetUtilityService.getWidgetNameVersion($scope.$resolve.widget, $scope.$resolve.widgetBasePath);
          
          if (widgetNameVersion) {
            widgetUtilityService.checkTranslationMode(widgetNameVersion).then(function () {
              $scope.viewWidgetVars = {
                // Create your translating static string variables here
                LABEL_NOT_CONFIGURABLE: widgetUtilityService.translate('customTags.LABEL_NOT_CONFIGURABLE')
              };
              loadModules();
            });
          } else {
            $timeout(function() {
              $scope.cancel();
            });
          }
        }

        function loadModules() {
          appModulesService.load(true).then(function (modules) {
            $scope.modules = modules;
            //Create a list of modules with atleast one JSON field
            $scope.modules.forEach((module) => {
              var moduleMetaData = modelMetadatasService.getMetadataByModuleType(module.type);
              for (let fieldIndex = 0; fieldIndex < moduleMetaData.attributes.length; fieldIndex++) {
                //Check If JSON field is present in the module
                if (moduleMetaData.attributes[fieldIndex].type === "object") {
                  $scope.jsonObjModuleList.push(module);
                  break;
                }
              }
            });
          });
          if ($scope.config.resourceModule) {
            $scope.loadAttributes();
          }
        }
    
        $scope.loadAttributes = function() {
          $scope.fields = [];
          $scope.fieldsArray = [];
          $scope.resourceField = [];
          var entity = new Entity($scope.config.resourceModule);
          entity.loadFields().then(function() {
            for (var key in entity.fields) {
              if (entity.fields[key].type === 'datetime') {
                entity.fields[key].type = 'datetime.quick';
              } else if(entity.fields[key].type === 'text'){
                $scope.resourceField.push(entity.fields[key]);
              }
            }
    
            $scope.fields = entity.getFormFields();
            angular.extend($scope.fields, entity.getRelationshipFields());
            $scope.fieldsArray = entity.getFormFieldsArray();
          });
        };

        function includeMoreTags (){
          $scope.config.includedTagsStructure.push({
              structureSelected: '',
              field: ''
          });
        }

        //remove layer
        function removeLayer(index) {
          if (index !== 0) {
            $scope.config.includedTagsStructure.splice(index);
          }
        }

        function init() {
            // To handle backward compatibility for widget
            _handleTranslations();
        }

        init();

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

        function save() {
            $uibModalInstance.close($scope.config);
        }

    }
})();
