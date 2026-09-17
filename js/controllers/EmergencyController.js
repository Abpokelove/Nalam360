(function () {
  'use strict';

  angular.module('Nalam360App').controller('EmergencyController', [
    '$scope',
    'ApiFactory',
    'NotificationService',
    function ($scope, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.contacts = [];

      function fetchEmergencyData() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getEmergencyContacts().then(function (result) {
          $scope.contacts = result;
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
