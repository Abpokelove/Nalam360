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

      $scope.isPatient = AuthService.isPatient();
      $scope.isDoctor = AuthService.isDoctor();
      $scope.profileDistricts = [];
      $scope.profileTaluks = [];
      $scope.profileVillages = [];
      $scope.profileLocationLoading = false;

      if ($scope.isPatient) {
        $scope.profileLocationLoading = true;
        ApiFactory.getLocations('district').then(function (districts) {
          $scope.profileDistricts = districts;
          if (!$scope.user.districtId) return;
          return ApiFactory.getLocations('taluk', $scope.user.districtId).then(function (taluks) {
            $scope.profileTaluks = taluks;
            if (!$scope.user.talukId) return;
            return ApiFactory.getLocations('village', $scope.user.talukId).then(function (villages) {
              $scope.profileVillages = villages;
            });
          });
        }).catch(function () {
          $scope.profileDistricts = [];
        }).finally(function () {
          $scope.profileLocationLoading = false;
        });
      }

      $scope.changeProfileDistrict = function () {
        $scope.user.talukId = '';
        $scope.user.villageId = '';
        $scope.user.village = '';
        $scope.profileTaluks = [];
        $scope.profileVillages = [];
        if (!$scope.user.districtId) return;
        ApiFactory.getLocations('taluk', $scope.user.districtId).then(function (taluks) {
          $scope.profileTaluks = taluks;
        });
      };

      $scope.changeProfileTaluk = function () {
        $scope.user.villageId = '';
        $scope.user.village = '';
        $scope.profileVillages = [];
        if (!$scope.user.talukId) return;
        ApiFactory.getLocations('village', $scope.user.talukId).then(function (villages) {
          $scope.profileVillages = villages;
        });
      };

      $scope.changeProfileVillage = function () {
        var village = $scope.profileVillages.find(function (location) { return location.id === $scope.user.villageId; });
        $scope.user.village = village ? village.name : '';
      };

      $scope.saving = false;
      $scope.supportForm = { subject: '', message: '' };

      $scope.saveProfile = function () {
        var profileData = { name: $scope.user.name };
        if ($scope.isPatient) {
          if (($scope.user.districtId || $scope.user.talukId || $scope.user.villageId) && (!$scope.user.districtId || !$scope.user.talukId || !$scope.user.villageId)) {
            NotificationService.error('Choose a complete district, taluk, and village hierarchy.');
            return;
          }
          profileData.village = $scope.user.village;
          profileData.districtId = $scope.user.districtId;
          profileData.talukId = $scope.user.talukId;
          profileData.villageId = $scope.user.villageId;
          profileData.gender = $scope.user.gender;
          profileData.dob = $scope.user.dob;
        }
        $scope.saving = true;

        ApiFactory.updateProfile($scope.user, profileData).then(function (result) {
          $scope.saving = false;
          AuthService.updateCurrentUser(result.user);
          $scope.user = angular.copy(result.user);
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
