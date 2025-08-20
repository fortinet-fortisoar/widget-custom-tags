/* Copyright start
    MIT License
    Copyright (c) 2025 Fortinet Inc
Copyright end */
'use strict';
(function () {
    angular
      .module('cybersponse')
      .controller('customTags110Ctrl', customTags110Ctrl);

    customTags110Ctrl.$inject = ['$scope', 'widgetUtilityService', '$state', 'appModulesService', 'customTagsService', 'modelMetadatasService', 'localStorageService', 'FormEntityService', '$q'];

    function customTags110Ctrl($scope, widgetUtilityService, $state, appModulesService, customTagsService, modelMetadatasService, localStorageService, FormEntityService, $q) {  
      $scope.noData = false;
      
      $scope.customTags = [];

      $scope.navigateToOutbreak = navigateToOutbreak;
      $scope.pageState = $state;
      $scope.processing = true;
      $scope.tooltipErrorMsg = '';
      $scope.includedTagsData = [{}];

      function navigateToOutbreak(_id){
        let module = $scope.config.navigationModule;
        var viewParams = {
          indicator: _id
        };
        var state = appModulesService.getState(module);

        var params = {
          module:  module,
          id: _id,
          viewParams: JSON.stringify(viewParams),
          previousState: $state.current.name,
          previousParams: JSON.stringify($state.params)
        };
        var leavingViewPanel = state.indexOf('viewPanel') === -1 && $state.current.name.indexOf('viewPanel') !== -1;
        if (leavingViewPanel) {
          var url = $state.href(state, params);
          $window.open(url, '_blank');
        } else {
          $state.go(state, params);
        }
      }
  
      function _handleTranslations() {
        widgetUtilityService.checkTranslationMode($scope.$parent.model.type).then(function () {
          $scope.viewWidgetVars = {
            // Create your translating static string variables here
          };
        });
        checkCurrentPage($scope.pageState);
      }


      function checkCurrentPage(state){
        if (state.current.name.includes('viewPanel.modulesDetail')) {
          let params = $scope.pageState.current.params;
          $scope.indicator = params.id;
          fetchTagsData();
        }
      }

      function fetchTagsData(){ 
        let moduleMetaData = modelMetadatasService.getMetadataByModuleType($scope.config.resourceModule);
        let _connectorName = moduleMetaData.dataSource.connector;
        let _connectorAction = moduleMetaData.dataSource.operation;
        $scope.loadIncludedTagsData(_connectorName, _connectorAction).then(() => {
          $scope.includedTagsData.sort((a, b) => a.tagsKey - b.tagsKey);
        });
      }


      $scope.loadIncludedTagsData = function (_connectorName, _connectorAction) {
        const deferred = $q.defer(); // Create a master deferred
        const promises = [];

        $scope.processing = true;
        $scope.includedTagsData = []; // Optionally reset before loading

        $scope.config.includedTagsStructure.forEach(function (element) {
          const payload = {
            indicator: $scope.indicator,
            fields: element.field
          };

          const promise = customTagsService.executeAction(_connectorName, _connectorAction, payload)
            .then(function (response) {
              if (response.data[element.field] && response.data[element.field].length > 0) {
                const tagData = {
                  structureSelected: element.structureSelected,
                  tagsKey : getDisplayKey(element.field),
                  noData: false,
                  tooltipErrorMsg : ''
                };

                if (element.structureSelected !== 'URL') {
                  const resourceFieldValue = response.data[element.field];
                  tagData.customTags = Array.isArray(resourceFieldValue)
                    ? resourceFieldValue
                    : [resourceFieldValue];

                $scope.includedTagsData.push(tagData);
                } else {
                  changeURLTagsSchema(response.data[element.field], element.navigationModule).then((response)=>{
                    tagData.customTags = response;
                    $scope.includedTagsData.push(tagData);
                  });
                }

              } else {
                tagData.noData = true;
              }
            })
            .catch(function (error) {
              $tagData.noData = true;
              tagData.tooltipErrorMsg = 'Error while fetching data. Please check connector logs for more info.';
            });

          promises.push(promise);
        });

        $q.all(promises).finally(function () {
          $scope.processing = false;
          deferred.resolve(); // Resolve once all are done
        });

        return deferred.promise;
      };

  
      function changeURLTagsSchema(_tagsData, navigationModule) {
        const deferred = $q.defer(); // Create a master deferred
        if (!Array.isArray(_tagsData)) return;

        $scope.processing = true;

        const tagPromises = _tagsData.map(tag => {
          return customTagsService.getTagsQuery(tag, navigationModule)
            .then(response => {
              const members = response?.data?.['hydra:member'];

              if (members && members.length > 0) {
                return {
                  key: tag,
                  id: members[0].uuid,
                  module: navigationModule
                };
              } else {
                return { key: tag };
              }
            })
            .catch(error => {
              console.error(`Error fetching tag "${tag}":`, error);
              return { key: tag }; // still return something to avoid breaking the flow
            });
        });

        // Wait for all tag fetches to complete
        Promise.all(tagPromises)
          .then(results => {
            //$scope.includedTagsData.customTags.push(...results);
            deferred.resolve(results); 
          })
          .finally(() => {
            $scope.processing = false;
          });
          return deferred.promise;
      }

      function getDisplayKey(_key){
        let _attributes =  loadModuleFromLocalStorage().attributes;
        return _attributes.find(i=> i.name === _key).descriptions.singular
      }

      function loadModuleFromLocalStorage() {
        const _param = 'metadata.' + $scope.config.resourceModule;
        return localStorageService.get(_param);
      }

      function init() {
        // To handle backward compatibility for widget
        _handleTranslations();
      }

      init();
    }
})();
