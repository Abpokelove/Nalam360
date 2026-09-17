(function () {
  'use strict';

  angular.module('Nalam360App').controller('AppointmentController', [
    '$scope',
    'ApiFactory',
    'NotificationService',
    function ($scope, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.appointments = [];

      function fetchAppointments() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getAppointments().then(function (result) {
          $scope.appointments = result;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to fetch your appointments schedule.';
          NotificationService.error($scope.error);
        });
      }

      $scope.cancelAppointment = function (appointment) {
        if (!confirm('Are you sure you want to cancel visit with ' + appointment.doctorName + '?')) {
          return;
        }

        ApiFactory.cancelAppointment(appointment.id).then(function (updated) {
          appointment.status = 'cancelled';
          NotificationService.warning('Appointment with ' + updated.doctorName + ' cancelled.');
        }).catch(function () {
          NotificationService.error('Failed to cancel appointment.');
        });
      };

      fetchAppointments();
    }
  ]);
})();
