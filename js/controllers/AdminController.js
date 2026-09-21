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

      // Doctor Add/Edit Modal
      $scope.isDoctorModalOpen = false;
      $scope.editingDoctor = null;
      $scope.doctorForm = {
        name: '',
        email: '',
        mobile: '',
        password: 'doctor123',
        specialty: 'General Medicine',
        village: 'Melur',
        experience: 5,
        fee: 150,
        available: true
      };

      $scope.specialtiesList = ['General Medicine', 'Pediatrics', 'Cardiology', 'Gynecology', 'Ophthalmology', 'Dermatology'];
      $scope.villagesList = ['Melur', 'Karur', 'Hosur', 'Sivakasi', 'Pollachi', 'Tenkasi'];

      function loadAdminDashboard() {
        $scope.loading = true;
        $scope.error = null;

        $q.all([
          ApiFactory.getAdminSummary().catch(function () { return {}; }),
          ApiFactory.getDoctors().catch(function () { return []; }),
          ApiFactory.getUsers().catch(function () { return []; })
        ]).then(function (results) {
          $scope.summary = results[0] || {};
          $scope.doctors = results[1] || [];
          $scope.users = results[2] || [];
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
          village: 'Melur',
          experience: 5,
          fee: 150,
          available: true
        };
        $scope.isDoctorModalOpen = true;
      };

      $scope.openEditDoctorModal = function (doctor) {
        $scope.editingDoctor = doctor;
        $scope.doctorForm = angular.copy(doctor);
        $scope.isDoctorModalOpen = true;
      };

      $scope.closeDoctorModal = function () {
        $scope.isDoctorModalOpen = false;
        $scope.editingDoctor = null;
      };

      $scope.saveDoctor = function () {
        if (!$scope.doctorForm.name || !$scope.doctorForm.specialty || !$scope.doctorForm.village) {
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
