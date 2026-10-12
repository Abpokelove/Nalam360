(function () {
  'use strict';

  angular.module('Nalam360App').controller('EmergencyController', [
    '$scope',
    '$q',
    'ApiFactory',
    'NotificationService',
    function ($scope, $q, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.contacts = [];
      $scope.facilities = [];

      function fetchEmergencyData() {
        $scope.loading = true;
        $scope.error = null;

        $q.all([ApiFactory.getEmergencyContacts(), ApiFactory.getFacilities()]).then(function (results) {
          $scope.contacts = results[0];
          $scope.facilities = results[1];
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to load emergency hotline directory.';
          NotificationService.error($scope.error);
        });
      }

      $scope.triggerEmergencyDial = function (contact) {
        NotificationService.warning('Dialing ' + contact.name + ' (' + contact.number + ')...');
      };

      fetchEmergencyData();
    }
  ]);
})();
