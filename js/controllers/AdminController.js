(function () {
  'use strict';

  angular.module('Nalam360App').controller('AdminController', [
    '$scope',
    '$q',
    'ApiFactory',
    'NotificationService',
    function ($scope, $q, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;

      $scope.summary = {};
      $scope.doctors = [];
      $scope.users = [];
      $scope.locations = [];
      $scope.facilities = [];
      $scope.doctorTaluks = [];
      $scope.doctorVillages = [];
      $scope.doctorFacilities = [];

      // Doctor Add/Edit Modal
      $scope.isDoctorModalOpen = false;
      $scope.editingDoctor = null;
      $scope.doctorForm = {
        name: '',
        email: '',
        mobile: '',
        password: 'doctor123',
        specialty: 'General Medicine',
        village: '',
        districtId: '',
        talukId: '',
        villageId: '',
        facilityId: '',
        experience: 5,
        fee: 150,
        password: '',
        available: true
      };

      $scope.specialtiesList = ['General Medicine', 'Pediatrics', 'Cardiology', 'Gynecology', 'Ophthalmology', 'Dermatology'];
      $scope.changeDoctorDistrict = function () {
        $scope.doctorForm.talukId = '';
        $scope.doctorForm.villageId = '';
        $scope.doctorForm.facilityId = '';
        $scope.doctorTaluks = $scope.locations.filter(function (location) {
          return location.level === 'taluk' && location.parentId === $scope.doctorForm.districtId;
        });
        $scope.doctorVillages = [];
        $scope.doctorFacilities = [];
      };

      $scope.changeDoctorTaluk = function () {
        $scope.doctorForm.villageId = '';
        $scope.doctorForm.facilityId = '';
        $scope.doctorVillages = $scope.locations.filter(function (location) {
          return location.level === 'village' && location.parentId === $scope.doctorForm.talukId;
        });
        $scope.doctorFacilities = [];
      };

      $scope.changeDoctorVillage = function () {
        $scope.doctorForm.facilityId = '';
        $scope.doctorFacilities = $scope.facilities.filter(function (facility) {
          return facility.villageId === $scope.doctorForm.villageId && facility.verified;
        });
        var village = $scope.doctorVillages.find(function (location) { return location.id === $scope.doctorForm.villageId; });
        $scope.doctorForm.village = village ? village.name : '';
      };

      function loadAdminDashboard() {
        $scope.loading = true;
        $scope.error = null;

        $q.all([
          ApiFactory.getAdminSummary(),
          ApiFactory.getDoctors(),
          ApiFactory.getUsers(),
          ApiFactory.getAdminLocations(),
          ApiFactory.getAdminFacilities()
        ]).then(function (results) {
          $scope.summary = results[0] || {};
          $scope.doctors = results[1] || [];
          $scope.users = results[2] || [];
          $scope.locations = results[3] || [];
          $scope.facilities = results[4] || [];
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to load admin workspace data.';
          NotificationService.error($scope.error);
        });
      }

      $scope.openAddDoctorModal = function () {
        $scope.editingDoctor = null;
        $scope.doctorForm = {
          name: '',
          email: '',
          mobile: '',
          password: 'doctor123',
          specialty: 'General Medicine',
          village: '',
          districtId: '',
          talukId: '',
          villageId: '',
          facilityId: '',
          experience: 5,
          fee: 150,
          password: '',
          available: true
        };
        $scope.isDoctorModalOpen = true;
      };

      $scope.openEditDoctorModal = function (doctor) {
        $scope.editingDoctor = doctor;
        $scope.doctorForm = angular.copy(doctor);
        $scope.doctorForm.password = '';
        if ($scope.doctorForm.districtId) {
          $scope.changeDoctorDistrict();
          $scope.doctorForm.talukId = doctor.talukId;
          $scope.changeDoctorTaluk();
          $scope.doctorForm.villageId = doctor.villageId;
          $scope.changeDoctorVillage();
          $scope.doctorForm.facilityId = doctor.facilityId;
        }
        $scope.isDoctorModalOpen = true;
      };

      $scope.closeDoctorModal = function () {
        $scope.isDoctorModalOpen = false;
        $scope.editingDoctor = null;
      };

      $scope.saveDoctor = function () {
        if (!$scope.doctorForm.name || !$scope.doctorForm.specialty || !$scope.doctorForm.villageId || !$scope.doctorForm.facilityId) {
          NotificationService.error('Please complete all required fields.');
          return;
        }

        if ($scope.editingDoctor) {
          ApiFactory.updateDoctor($scope.editingDoctor.id, $scope.doctorForm).then(function (updated) {
            var index = $scope.doctors.findIndex(function (d) { return d.id === updated.id; });
            if (index !== -1) {
              $scope.doctors[index] = updated;
            }
            NotificationService.success('Doctor details updated.');
            $scope.closeDoctorModal();
          }).catch(function (err) {
            NotificationService.error((err && err.message) || 'Failed to update doctor.');
          });
        } else {
          ApiFactory.createDoctor($scope.doctorForm).then(function (created) {
            $scope.doctors.push(created);
            $scope.summary.doctors = ($scope.summary.doctors || 0) + 1;
            NotificationService.success('Doctor account created! Email: ' + (created.email || $scope.doctorForm.email));
            $scope.closeDoctorModal();
          }).catch(function (err) {
            NotificationService.error((err && err.message) || 'Failed to register doctor.');
          });
        }
      };

      $scope.deleteDoctor = function (doctor) {
        if (!confirm('Are you sure you want to remove ' + doctor.name + ' from the network?')) {
          return;
        }

        ApiFactory.deleteDoctor(doctor.id).then(function () {
          var index = $scope.doctors.findIndex(function (d) { return d.id === doctor.id; });
          if (index !== -1) {
            $scope.doctors.splice(index, 1);
          }
          $scope.summary.doctors = Math.max(0, ($scope.summary.doctors || 1) - 1);
          NotificationService.info(doctor.name + ' removed.');
        }).catch(function (err) {
          NotificationService.error((err && err.message) || 'Failed to delete doctor.');
        });
      };

      loadAdminDashboard();
    }
  ]);
})();
