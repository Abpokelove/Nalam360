(function () {
  'use strict';

  angular.module('Nalam360App').controller('ProfileController', [
    '$scope',
    'ApiFactory',
    'AuthService',
    'NotificationService',
    function ($scope, ApiFactory, AuthService, NotificationService) {

      $scope.user = angular.copy(AuthService.state.currentUser || {
        name: 'Muthuswamy S.',
        mobile: '9876543210',
        village: 'Melur',
        gender: 'Male',
        dob: '1982-06-15',
        role: 'patient'
      });

      $scope.villagesList = ['Melur', 'Karur', 'Hosur', 'Sivakasi', 'Pollachi', 'Tenkasi'];

      $scope.saving = false;
      $scope.supportForm = { subject: '', message: '' };

      $scope.saveProfile = function () {
        $scope.saving = true;

        ApiFactory.updateProfile($scope.user).then(function (result) {
          $scope.saving = false;
          AuthService.state.currentUser = result.user;
          NotificationService.success('Profile details saved successfully!');
        }).catch(function (err) {
          $scope.saving = false;
          NotificationService.error('Failed to update profile.');
        });
      };

      $scope.submitSupportTicket = function () {
        if (!$scope.supportForm.subject || !$scope.supportForm.message) {
          NotificationService.error('Please enter a subject and message.');
          return;
        }

        NotificationService.success('Support inquiry submitted! Demo Ticket ID: #NALAM-SUP-' + Math.floor(100 + Math.random() * 900));
        $scope.supportForm = { subject: '', message: '' };
      };
    }
  ]);
})();
