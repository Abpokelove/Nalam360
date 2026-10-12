(function () {
  'use strict';

  angular.module('Nalam360App').controller('LocationAdminController', [
    '$scope',
    '$q',
    'ApiFactory',
    'NotificationService',
    function ($scope, $q, ApiFactory, NotificationService) {
      $scope.loading = true;
      $scope.error = null;
      $scope.locations = [];
      $scope.facilities = [];
      $scope.parentOptions = [];
      $scope.talukOptions = [];
      $scope.villageOptions = [];
      $scope.editingLocationId = null;
      $scope.editingFacilityId = null;
      $scope.savingLocation = false;
      $scope.savingFacility = false;

      function resetLocationForm() {
        $scope.locationForm = { name: '', level: 'district', parentId: '', sourceUrl: '', verified: false };
        $scope.editingLocationId = null;
        $scope.parentOptions = [];
      }

      function resetFacilityForm() {
        $scope.facilityForm = { name: '', type: 'phc', districtId: '', talukId: '', villageId: '', address: '', contact: '', sourceUrl: '', verified: false };
        $scope.editingFacilityId = null;
        $scope.talukOptions = [];
        $scope.villageOptions = [];
      }

      function load() {
        $scope.loading = true;
        $scope.error = null;
        return $q.all([ApiFactory.getAdminLocations(), ApiFactory.getAdminFacilities()]).then(function (results) {
          $scope.locations = results[0];
          $scope.facilities = results[1];
        }).catch(function (error) {
          $scope.error = (error && error.message) || 'Unable to load location and facility records.';
        }).finally(function () {
          $scope.loading = false;
        });
      }

      $scope.changeLocationLevel = function () {
        $scope.locationForm.parentId = '';
        var parentLevel = $scope.locationForm.level === 'taluk' ? 'district' : 'taluk';
        $scope.parentOptions = $scope.locationForm.level === 'district' ? [] : $scope.locations.filter(function (location) {
          return location.level === parentLevel;
        });
      };

      $scope.changeFacilityDistrict = function () {
        $scope.facilityForm.talukId = '';
        $scope.facilityForm.villageId = '';
        $scope.villageOptions = [];
        $scope.talukOptions = $scope.locations.filter(function (location) {
          return location.level === 'taluk' && location.parentId === $scope.facilityForm.districtId;
        });
      };

      $scope.changeFacilityTaluk = function () {
        $scope.facilityForm.villageId = '';
        $scope.villageOptions = $scope.locations.filter(function (location) {
          return location.level === 'village' && location.parentId === $scope.facilityForm.talukId;
        });
      };

      $scope.editLocation = function (location) {
        $scope.editingLocationId = location.id;
        $scope.locationForm = {
          name: location.name,
          level: location.level,
          parentId: location.parentId || '',
          sourceUrl: location.sourceUrl || '',
          verified: location.verified
        };
        $scope.changeLocationLevel();
        $scope.locationForm.parentId = location.parentId || '';
      };

      $scope.saveLocation = function () {
        if (! $scope.locationForm.name || ($scope.locationForm.level !== 'district' && !$scope.locationForm.parentId)) return;
        $scope.savingLocation = true;
        var save = $scope.editingLocationId
          ? ApiFactory.updateLocation($scope.editingLocationId, $scope.locationForm)
          : ApiFactory.createLocation($scope.locationForm);
        save.then(function () {
          NotificationService.success($scope.editingLocationId ? 'Location record updated.' : 'Location record added.');
          resetLocationForm();
          return load();
        }).catch(function (error) {
          NotificationService.error((error && error.message) || 'Unable to save location record.');
        }).finally(function () {
          $scope.savingLocation = false;
        });
      };

      $scope.editFacility = function (facility) {
        $scope.editingFacilityId = facility.id;
        $scope.facilityForm = angular.copy(facility);
        $scope.changeFacilityDistrict();
        $scope.facilityForm.talukId = facility.talukId;
        $scope.changeFacilityTaluk();
        $scope.facilityForm.villageId = facility.villageId;
      };

      $scope.saveFacility = function () {
        var form = $scope.facilityForm;
        if (!form.name || !form.districtId || !form.talukId || !form.villageId) return;
        $scope.savingFacility = true;
        var save = $scope.editingFacilityId
          ? ApiFactory.updateFacility($scope.editingFacilityId, form)
          : ApiFactory.createFacility(form);
        save.then(function () {
          NotificationService.success($scope.editingFacilityId ? 'Facility record updated.' : 'Facility record added.');
          resetFacilityForm();
          return load();
        }).catch(function (error) {
          NotificationService.error((error && error.message) || 'Unable to save facility record.');
        }).finally(function () {
          $scope.savingFacility = false;
        });
      };

      $scope.cancelLocationEdit = resetLocationForm;
      $scope.cancelFacilityEdit = resetFacilityForm;
      resetLocationForm();
      resetFacilityForm();
      load();
    }
  ]);
})();