(function () {
  'use strict';

  angular.module('Nalam360App').controller('CampController', [
    '$scope',
    '$q',
    'ApiFactory',
    'AuthService',
    'NotificationService',
    function ($scope, $q, ApiFactory, AuthService, NotificationService) {

      $scope.isAdmin = AuthService.isAdmin();
      $scope.loading = true;
      $scope.error = null;
      $scope.camps = [];
      $scope.locations = [];
      $scope.facilities = [];
      $scope.villages = [];
      $scope.currentUser = AuthService.state.currentUser || {};
      $scope.selectedVillageId = $scope.currentUser.villageId || '';
      $scope.talukOptions = [];
      $scope.villageOptions = [];
      $scope.facilityOptions = [];
      $scope.savingCamp = false;
      $scope.campForm = {
        title: '', date: '', doctor: '', category: 'general', description: '',
        districtId: '', talukId: '', villageId: '', facilityId: '', imageUrl: ''
      };

      var categoryIcons = {
        general: 'medical_services',
        eye: 'visibility',
        dental: 'dentistry',
        diabetes: 'bloodtype',
        'maternal-child': 'child_care'
      };

      var categoryImages = {
        general: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
        eye: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80',
        dental: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80',
        diabetes: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
        'maternal-child': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80'
      };

      $scope.campIcon = function (category) {
        return categoryIcons[category] || categoryIcons.general;
      };

      $scope.campImage = function (camp) {
        if (camp && camp.imageUrl) return camp.imageUrl;
        var cat = (camp && camp.category) || 'general';
        return categoryImages[cat] || categoryImages.general;
      };

      function fetchCamps() {
        $scope.loading = true;
        $scope.error = null;
        var requests = [ApiFactory.getCamps($scope.isAdmin ? '' : $scope.selectedVillageId)];
        if ($scope.isAdmin) requests.push(ApiFactory.getAdminLocations(), ApiFactory.getAdminFacilities());
        else if ($scope.currentUser.talukId) requests.push(ApiFactory.getLocations('village', $scope.currentUser.talukId));
        $q.all(requests).then(function (results) {
          $scope.camps = results[0];
          if ($scope.isAdmin) {
            $scope.locations = results[1];
            $scope.facilities = results[2];
          } else {
            $scope.villages = results[1] || [];
          }
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to fetch health camp events.';
          NotificationService.error($scope.error);
        });
      }

      $scope.changeCampVillage = fetchCamps;

      $scope.changeDistrict = function () {
        $scope.campForm.talukId = '';
        $scope.campForm.villageId = '';
        $scope.campForm.facilityId = '';
        $scope.talukOptions = $scope.locations.filter(function (location) {
          return location.level === 'taluk' && location.parentId === $scope.campForm.districtId;
        });
        $scope.villageOptions = [];
        $scope.facilityOptions = [];
      };

      $scope.changeTaluk = function () {
        $scope.campForm.villageId = '';
        $scope.campForm.facilityId = '';
        $scope.villageOptions = $scope.locations.filter(function (location) {
          return location.level === 'village' && location.parentId === $scope.campForm.talukId;
        });
        $scope.facilityOptions = [];
      };

      $scope.changeVillage = function () {
        $scope.campForm.facilityId = '';
        $scope.facilityOptions = $scope.facilities.filter(function (facility) {
          return facility.villageId === $scope.campForm.villageId && facility.verified;
        });
      };

      $scope.createCamp = function () {
        if (!$scope.campForm.title || !$scope.campForm.date || !$scope.campForm.doctor || !$scope.campForm.description || !$scope.campForm.villageId) return;
        $scope.savingCamp = true;
        var payload = angular.copy($scope.campForm);
        var selectedVillage = $scope.villageOptions.find(function (location) { return location.id === payload.villageId; });
        payload.village = selectedVillage ? selectedVillage.name : '';
        ApiFactory.createCamp(payload).then(function () {
          NotificationService.success('Health camp saved.');
          $scope.campForm = {
            title: '', date: '', doctor: '', category: 'general', description: '',
            districtId: '', talukId: '', villageId: '', facilityId: '', imageUrl: ''
          };
          return fetchCamps();
        }).catch(function (error) {
          NotificationService.error((error && error.message) || 'Unable to save health camp.');
        }).finally(function () {
          $scope.savingCamp = false;
        });
      };

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
