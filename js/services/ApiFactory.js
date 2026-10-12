(function () {
  'use strict';

  angular.module('Nalam360App').factory('ApiFactory', ['$q', '$http', '$window', '$injector', function ($q, $http, $window, $injector) {

    var redirectingToLogin = false;

    function request(method, url, data, params) {
      var token = $window.localStorage.getItem('nalam360_access_token');
      return $http({
        method: method,
        url: url,
        data: data,
        params: params,
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      }).then(function (response) {
        return response.data;
      }, function (response) {
        if (response.status === 401 && url !== '/api/auth/login' && !redirectingToLogin) {
          redirectingToLogin = true;
          try {
            var auth = $injector.get('AuthService');
            if (auth && typeof auth.clearSession === 'function') {
              auth.clearSession();
            }
          } catch (e) {
            $window.localStorage.removeItem('nalam360_access_token');
            $window.localStorage.removeItem('nalam360_active_session');
          }
          try {
            var location = $injector.get('$location');
            if (location && location.path() !== '/login' && location.path() !== '/onboarding') {
              location.path('/login');
            }
          } catch (e) {
            $window.location.hash = '#/login';
          }
          setTimeout(function () { redirectingToLogin = false; }, 1000);
        }
        return $q.reject(response.data || { message: 'Request failed.' });
      });
    }

    return {
      getHealth: function () {
        return request('GET', '/api/health');
      },

      login: function (credentials) {
        return request('POST', '/api/auth/login', credentials);
      },

      register: function (userData) {
        return request('POST', '/api/auth/register', userData);
      },

      getMe: function () {
        return request('GET', '/api/auth/me');
      },

      updateProfile: function (user, profileData) {
        return request('PUT', '/api/auth/me', profileData || user);
      },

      logout: function () {
        return request('POST', '/api/auth/logout').catch(function () {
          return { success: true };
        });
      },

      // Patients API (Doctor & Admin view)
      getPatients: function () {
        return request('GET', '/api/patients');
      },

      // System Accounts (Admin view)
      getUsers: function () {
        return request('GET', '/api/users');
      },

      // Doctors CRUD
      getDoctors: function (filters) {
        return request('GET', '/api/doctors', null, filters);
      },

      getDoctorById: function (id) {
        return request('GET', '/api/doctors/' + id);
      },

      getDoctorAvailability: function (id, date, villageId) {
        return request('GET', '/api/doctors/' + id + '/availability', null, { date: date, villageId: villageId });
      },

      createDoctor: function (doctorData) {
        return request('POST', '/api/doctors', doctorData);
      },

      updateDoctor: function (id, doctorData) {
        return request('PUT', '/api/doctors/' + id, doctorData);
      },

      deleteDoctor: function (id) {
        return request('DELETE', '/api/doctors/' + id);
      },

      // Appointments CRUD
      getAppointments: function () {
        return request('GET', '/api/appointments');
      },

      getDoctorAppointments: function (doctorId) {
        return request('GET', '/api/appointments');
      },

      createAppointment: function (bookingData) {
        return request('POST', '/api/appointments', bookingData);
      },

      updateAppointmentStatus: function (id, status) {
        return request('PUT', '/api/appointments/' + id, { status: status });
      },

      cancelAppointment: function (id) {
        return request('DELETE', '/api/appointments/' + id);
      },

      // Reminders CRUD
      getReminders: function () {
        return request('GET', '/api/reminders');
      },

      createReminder: function (reminderData) {
        return request('POST', '/api/reminders', reminderData);
      },

      toggleReminderComplete: function (id) {
        return request('PUT', '/api/reminders/' + id, {});
      },

      deleteReminder: function (id) {
        return request('DELETE', '/api/reminders/' + id);
      },

      // Health Camps CRUD
      getCamps: function (villageId) {
        return request('GET', '/api/camps', null, villageId ? { villageId: villageId } : {});
      },

      createCamp: function (campData) {
        return request('POST', '/api/camps', campData);
      },

      deleteCamp: function (id) {
        return request('DELETE', '/api/camps/' + id);
      },

      registerCampInterest: function (id) {
        return request('POST', '/api/camps/' + id + '/register');
      },

      getPrescriptions: function () {
        return request('GET', '/api/prescriptions');
      },

      createPrescription: function (prescriptionData) {
        return request('POST', '/api/prescriptions', prescriptionData);
      },

      updatePrescription: function (id, prescriptionData) {
        return request('PUT', '/api/prescriptions/' + id, prescriptionData);
      },

      getLocations: function (level, parentId) {
        var params = {};
        if (level) params.level = level;
        if (parentId) params.parentId = parentId;
        return request('GET', '/api/locations', null, params);
      },

      getFacilities: function (villageId) {
        return request('GET', '/api/facilities', null, villageId ? { villageId: villageId } : {});
      },

      getAdminLocations: function () {
        return request('GET', '/api/admin/locations');
      },

      createLocation: function (locationData) {
        return request('POST', '/api/admin/locations', locationData);
      },

      updateLocation: function (id, locationData) {
        return request('PUT', '/api/admin/locations/' + id, locationData);
      },

      getAdminFacilities: function () {
        return request('GET', '/api/admin/facilities');
      },

      createFacility: function (facilityData) {
        return request('POST', '/api/admin/facilities', facilityData);
      },

      updateFacility: function (id, facilityData) {
        return request('PUT', '/api/admin/facilities/' + id, facilityData);
      },

      // Awareness
      getAwarenessArticles: function () {
        return request('GET', '/api/awareness');
      },

      // Emergency
      getEmergencyContacts: function () {
        return request('GET', '/api/emergency');
      },

      // Summaries
      getPatientSummary: function () {
        return $q.all([this.getAppointments(), this.getReminders()]).then(function (res) {
          var apps = res[0] || [];
          var rems = res[1] || [];
          return {
            appointments: apps.length,
            reminders: rems.length,
            completedDoses: rems.filter(function (r) { return r.completed; }).length
          };
        });
      },

      getDoctorSummary: function () {
        return $q.all([this.getAppointments(), this.getPatients(), this.getCamps()]).then(function (res) {
          var apps = res[0] || [];
          var pats = res[1] || [];
          var camps = res[2] || [];
          return {
            todayConsultations: apps.filter(function (a) { return a.status === 'scheduled'; }).length,
            totalPatients: pats.length,
            completedVisits: apps.filter(function (a) { return a.status === 'completed'; }).length,
            activeCamps: camps.length
          };
        });
      },

      getAdminSummary: function () {
        return request('GET', '/api/admin/summary');
      }
    };
  }]);
})();

