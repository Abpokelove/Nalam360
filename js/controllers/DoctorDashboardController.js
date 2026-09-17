(function () {
  'use strict';

  angular.module('Nalam360App').controller('DoctorDashboardController', [
    '$scope',
    'ApiFactory',
    'AuthService',
    'NotificationService',
    function ($scope, ApiFactory, AuthService, NotificationService) {

      $scope.doctor = AuthService.state.currentUser || { name: 'Dr. Arumugam K.', specialty: 'General Medicine', village: 'Melur' };
      $scope.loading = true;
      $scope.error = null;

      $scope.summary = {};
      $scope.appointments = [];
      $scope.patients = [];

      function loadDoctorData() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getDoctorSummary().then(function (sumRes) {
          $scope.summary = sumRes;
          return ApiFactory.getDoctorAppointments($scope.doctor.id);
        }).then(function (appsRes) {
          $scope.appointments = appsRes;
          return ApiFactory.getPatients();
        }).then(function (patsRes) {
          $scope.patients = patsRes;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to load doctor workspace overview.';
          NotificationService.error($scope.error);
        });
      }

      $scope.updateStatus = function (appointment, newStatus) {
        ApiFactory.updateAppointmentStatus(appointment.id, newStatus).then(function (updated) {
          appointment.status = updated.status;
          NotificationService.success('Visit status updated to ' + newStatus);
        }).catch(function () {
          NotificationService.error('Failed to update visit status.');
        });
      };

      loadDoctorData();
    }
  ]);
})();
