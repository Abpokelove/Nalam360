(function () {
  'use strict';

  angular.module('Nalam360App').controller('DoctorPatientsController', [
    '$scope',
    'ApiFactory',
    'NotificationService',
    function ($scope, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.patients = [];

      $scope.searchQuery = '';
      $scope.selectedVillage = '';

      $scope.villagesList = ['Melur', 'Karur', 'Hosur', 'Sivakasi', 'Pollachi', 'Tenkasi'];

      function loadPatients() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getPatients().then(function (result) {
          $scope.patients = result;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to fetch patient roster.';
          NotificationService.error($scope.error);
        });
      }

      $scope.filterPatient = function (pat) {
        var query = ($scope.searchQuery || '').toLowerCase();
        var matchesQuery = !query ||
          pat.name.toLowerCase().indexOf(query) !== -1 ||
          pat.mobile.indexOf(query) !== -1 ||
          pat.village.toLowerCase().indexOf(query) !== -1 ||
          pat.primaryConcern.toLowerCase().indexOf(query) !== -1;

        var matchesVillage = !$scope.selectedVillage || pat.village === $scope.selectedVillage;

        return matchesQuery && matchesVillage;
      };

      loadPatients();
    }
  ]);
})();
