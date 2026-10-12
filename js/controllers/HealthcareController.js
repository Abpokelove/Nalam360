(function () {
  'use strict';

  angular.module('Nalam360App').controller('HealthcareController', [
    '$scope',
    'ApiFactory',
    'AuthService',
    'NotificationService',
    function ($scope, ApiFactory, AuthService, NotificationService) {

      $scope.loading = true;
      $scope.locationLoading = true;
      $scope.error = null;
      $scope.doctors = [];
      $scope.facilities = [];
      $scope.villages = [];
      $scope.currentUser = AuthService.state.currentUser || {};

      $scope.searchQuery = '';
      $scope.selectedSpecialty = '';
      $scope.selectedVillageId = $scope.currentUser.villageId || '';
      $scope.selectedFacilityId = '';
      $scope.selectedAvailability = '';

      $scope.specialtiesList = ['General Medicine', 'Pediatrics', 'Cardiology', 'Gynecology', 'Ophthalmology', 'Dermatology'];

      // Booking Modal State
      $scope.bookingModalOpen = false;
      $scope.selectedDoctor = null;
      $scope.bookingForm = { date: null, time: '', villageId: '' };
      $scope.availableTimeSlots = [];
      $scope.loadingTimeSlots = false;
      $scope.submittingBooking = false;
      $scope.todayDate = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');

      function dateForApi(value) {
        if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
        return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
      }

      function fetchDoctors() {
        $scope.loading = true;
        $scope.error = null;

        var filters = {};
        if ($scope.selectedVillageId) filters.villageId = $scope.selectedVillageId;
        if ($scope.selectedSpecialty) filters.specialty = $scope.selectedSpecialty;
        if ($scope.selectedFacilityId) filters.facilityId = $scope.selectedFacilityId;
        if ($scope.selectedAvailability) filters.available = $scope.selectedAvailability;
        ApiFactory.getDoctors(filters).then(function (result) {
          $scope.doctors = result;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Failed to load doctor directory. Please try again.';
          NotificationService.error($scope.error);
        });
      }

      function fetchFacilities() {
        $scope.selectedFacilityId = '';
        $scope.facilities = [];
        if (!$scope.selectedVillageId) return;
        ApiFactory.getFacilities($scope.selectedVillageId).then(function (result) {
          $scope.facilities = result;
        }).catch(function (error) {
          NotificationService.error((error && error.message) || 'Unable to load verified facilities.');
        });
      }

      if ($scope.currentUser.talukId) {
        ApiFactory.getLocations('village', $scope.currentUser.talukId).then(function (result) {
          $scope.villages = result;
        }).catch(function () {
          $scope.villages = [];
        }).finally(function () {
          $scope.locationLoading = false;
        });
      } else {
        $scope.villages = [];
        $scope.locationLoading = false;
      }

      $scope.changeVillage = function () {
        fetchFacilities();
        fetchDoctors();
      };

      $scope.changeFilters = fetchDoctors;

      $scope.filterDoctor = function (doctor) {
        var query = ($scope.searchQuery || '').toLowerCase();
        var matchesQuery = !query ||
          doctor.name.toLowerCase().indexOf(query) !== -1 ||
          doctor.specialty.toLowerCase().indexOf(query) !== -1 ||
          doctor.village.toLowerCase().indexOf(query) !== -1;

        var matchesSpecialty = !$scope.selectedSpecialty || doctor.specialty === $scope.selectedSpecialty;

        return matchesQuery && matchesSpecialty;
      };

      $scope.openBookingModal = function (doctor) {
        if (!doctor.available) {
          NotificationService.warning(doctor.name + ' is available by appointment only. Please contact support.');
          return;
        }
        $scope.selectedDoctor = doctor;
        $scope.bookingForm = {
          date: new Date(),
          time: '',
          villageId: doctor.villageId
        };
        $scope.bookingModalOpen = true;
        $scope.updateAvailableTimes();
      };

      $scope.updateAvailableTimes = function () {
        var date = dateForApi($scope.bookingForm.date);
        $scope.availableTimeSlots = [];
        if (!date || !$scope.selectedDoctor) return;
        $scope.loadingTimeSlots = true;
        ApiFactory.getDoctorAvailability($scope.selectedDoctor.id, date, $scope.bookingForm.villageId).then(function (result) {
          $scope.availableTimeSlots = result.timeSlots || [];
          if ($scope.availableTimeSlots.indexOf($scope.bookingForm.time) === -1) $scope.bookingForm.time = '';
        }).catch(function (error) {
          NotificationService.error((error && error.message) || 'Unable to check appointment times.');
        }).finally(function () {
          $scope.loadingTimeSlots = false;
        });
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
          date: dateForApi($scope.bookingForm.date),
          time: $scope.bookingForm.time,
          villageId: $scope.bookingForm.villageId
        };

        ApiFactory.createAppointment(bookingPayload).then(function (result) {
          $scope.submittingBooking = false;
          $scope.closeBookingModal();
          NotificationService.success('Appointment booked successfully! Token ID: ' + result.token);
        }).catch(function (err) {
          $scope.submittingBooking = false;
          NotificationService.error((err && err.message) || 'Failed to book appointment. Please try again.');
        });
      };

      fetchFacilities();
      fetchDoctors();
    }
  ]);
})();
