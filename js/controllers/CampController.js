(function () {
  'use strict';

  angular.module('Nalam360App').controller('CampController', [
    '$scope',
    'ApiFactory',
    'NotificationService',
    function ($scope, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.camps = [];

      function fetchCamps() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getCamps().then(function (result) {
          $scope.camps = result;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to fetch health camp events.';
          NotificationService.error($scope.error);
        });
      }

      $scope.toggleCampRegistration = function (camp) {
        ApiFactory.registerCampInterest(camp.id).then(function (updated) {
          camp.isRegistered = updated.isRegistered;
          camp.registeredCount = updated.registeredCount;
          if (camp.isRegistered) {
            NotificationService.success('Registered interest for ' + camp.title + '!');
          } else {
            NotificationService.info('Cancelled interest registration.');
          }
        }).catch(function () {
          NotificationService.error('Failed to update camp interest.');
        });
      };

      fetchCamps();
    }
  ]);
})();
