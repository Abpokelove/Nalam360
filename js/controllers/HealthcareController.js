(function () {
  'use strict';

  angular.module('Nalam360App').controller('HealthcareController', [
    '$scope',
    'ApiFactory',
    'NotificationService',
    function ($scope, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.doctors = [];

      $scope.searchQuery = '';
      $scope.selectedSpecialty = '';
      $scope.selectedVillage = '';

      $scope.specialtiesList = ['General Medicine', 'Pediatrics', 'Cardiology', 'Gynecology', 'Ophthalmology', 'Dermatology'];
      $scope.villagesList = ['Melur', 'Karur', 'Hosur', 'Sivakasi', 'Pollachi', 'Tenkasi'];

      // Booking Modal State
      $scope.bookingModalOpen = false;
      $scope.selectedDoctor = null;
      $scope.bookingForm = {
        date: '',
        time: '',
        village: ''
      };
      $scope.submittingBooking = false;

      function fetchDoctors() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getDoctors().then(function (result) {
          $scope.doctors = result;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Failed to load doctor directory. Please try again.';
          NotificationService.error($scope.error);
        });
      }

      $scope.filterDoctor = function (doctor) {
        var query = ($scope.searchQuery || '').toLowerCase();
        var matchesQuery = !query ||
          doctor.name.toLowerCase().indexOf(query) !== -1 ||
          doctor.specialty.toLowerCase().indexOf(query) !== -1 ||
          doctor.village.toLowerCase().indexOf(query) !== -1;

        var matchesSpecialty = !$scope.selectedSpecialty || doctor.specialty === $scope.selectedSpecialty;
        var matchesVillage = !$scope.selectedVillage || doctor.village === $scope.selectedVillage;

        return matchesQuery && matchesSpecialty && matchesVillage;
      };

      $scope.openBookingModal = function (doctor) {
        if (!doctor.available) {
          NotificationService.warning(doctor.name + ' is available by appointment only. Please contact support.');
          return;
        }
        $scope.selectedDoctor = doctor;
        $scope.bookingForm = {
          date: new Date().toISOString().split('T')[0],
          time: '10:00 AM',
          village: doctor.village
        };
        $scope.bookingModalOpen = true;
      };

      $scope.closeBookingModal = function () {
        $scope.bookingModalOpen = false;
        $scope.selectedDoctor = null;
      };

      $scope.confirmBooking = function () {
        if (!$scope.bookingForm.date || !$scope.bookingForm.time) {
          NotificationService.error('Please select both date and time.');
          return;
        }

        $scope.submittingBooking = true;

        var bookingPayload = {
          doctorId: $scope.selectedDoctor.id,
          date: $scope.bookingForm.date,
          time: $scope.bookingForm.time,
          village: $scope.bookingForm.village || $scope.selectedDoctor.village
        };

        ApiFactory.createAppointment(bookingPayload).then(function (result) {
          $scope.submittingBooking = false;
          $scope.closeBookingModal();
          NotificationService.success('Appointment booked successfully! Token ID: ' + result.token);
        }).catch(function (err) {
          $scope.submittingBooking = false;
          NotificationService.error('Failed to book appointment. Please try again.');
        });
      };

      fetchDoctors();
    }
  ]);
})();
