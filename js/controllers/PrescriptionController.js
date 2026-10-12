(function () {
  'use strict';

  angular.module('Nalam360App').controller('PrescriptionController', [
    '$scope',
    '$q',
    'ApiFactory',
    'AuthService',
    'NotificationService',
    function ($scope, $q, ApiFactory, AuthService, NotificationService) {
      $scope.isDoctor = AuthService.isDoctor();
      $scope.loading = true;
      $scope.saving = false;
      $scope.error = null;
      $scope.appointments = [];
      $scope.prescriptions = [];
      $scope.selectedAppointmentId = '';
      $scope.editingPrescriptionId = null;
      $scope.form = { items: [], notes: '' };

      function getReferencedId(reference) {
        if (!reference) return '';
        return typeof reference === 'string' ? reference : String(reference._id || reference.id || '');
      }

      function load() {
        $scope.loading = true;
        $scope.error = null;
        var requests = [ApiFactory.getPrescriptions()];
        if ($scope.isDoctor) requests.push(ApiFactory.getAppointments());
        return $q.all(requests).then(function (results) {
          $scope.prescriptions = results[0];
          if ($scope.isDoctor) {
            $scope.appointments = results[1].filter(function (appointment) {
              return appointment.status === 'completed';
            });
          }
        }).catch(function (error) {
          $scope.error = (error && error.message) || 'Unable to load prescription records.';
        }).finally(function () {
          $scope.loading = false;
        });
      }

      $scope.selectAppointment = function () {
        var existing = $scope.prescriptions.find(function (prescription) {
          return getReferencedId(prescription.appointmentId) === String($scope.selectedAppointmentId);
        });
        $scope.editingPrescriptionId = existing ? existing.id : null;
        $scope.form = existing
          ? { items: angular.copy(existing.items), notes: existing.notes || '' }
          : { items: [{ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }], notes: '' };
      };

      $scope.addItem = function () {
        $scope.form.items.push({ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' });
      };

      $scope.removeItem = function (index) {
        $scope.form.items.splice(index, 1);
      };

      $scope.savePrescription = function () {
        if (!$scope.selectedAppointmentId || !$scope.form.items.length) {
          NotificationService.error('Select a completed consultation and add at least one medicine.');
          return;
        }
        $scope.saving = true;
        var data = {
          appointmentId: $scope.selectedAppointmentId,
          items: $scope.form.items,
          notes: $scope.form.notes
        };
        var save = $scope.editingPrescriptionId
          ? ApiFactory.updatePrescription($scope.editingPrescriptionId, data)
          : ApiFactory.createPrescription(data);

        save.then(function () {
          NotificationService.success($scope.editingPrescriptionId ? 'Prescription updated.' : 'Prescription saved for the consultation.');
          return load();
        }).catch(function (error) {
          NotificationService.error((error && error.message) || 'Unable to save prescription.');
        }).finally(function () {
          $scope.saving = false;
        });
      };

      load();
    }
  ]);
})();