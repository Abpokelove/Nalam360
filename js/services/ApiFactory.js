(function () {
  'use strict';

  angular.module('Nalam360App').factory('ApiFactory', ['$q', '$timeout', '$http', '$window', function ($q, $timeout, $http, $window) {

    function request(method, url, data) {
      var token = $window.localStorage.getItem('nalam360_access_token');
      return $http({ method: method, url: url, data: data, headers: token ? { Authorization: 'Bearer ' + token } : {} }).then(function (response) {
        return response.data;
      }, function (response) {
        return $q.reject(response.data || { message: 'Request failed.' });
      });
    }

    function delayedPromise(data, delayMs) {
      var deferred = $q.defer();
      $timeout(function () {
        deferred.resolve(angular.copy(data));
      }, delayMs || 120);
      return deferred.promise;
    }

    // Three Authentic Role Development Accounts
    var demoUsers = {
      'patient@nalam360.test': {
        id: 'usr_patient',
        name: 'Muthuswamy S.',
        email: 'patient@nalam360.test',
        mobile: '9876543210',
        role: 'patient',
        village: 'Melur',
        gender: 'Male',
        dob: '1982-06-15'
      },
      'doctor@nalam360.test': {
        id: 'usr_doctor',
        name: 'Dr. Arumugam K.',
        email: 'doctor@nalam360.test',
        mobile: '9888888888',
        role: 'doctor',
        specialty: 'General Medicine',
        village: 'Melur',
        experience: 14,
        fee: 150,
        gender: 'Male'
      },
      'admin@nalam360.test': {
        id: 'usr_admin',
        name: 'Nalam Administrator',
        email: 'admin@nalam360.test',
        mobile: '9999999999',
        role: 'admin',
        village: 'Central Office',
        gender: 'Female'
      }
    };

    // Seed Data
    var doctorsList = [
      { id: 'doc_1', name: 'Dr. Arumugam K.', specialty: 'General Medicine', village: 'Melur', experience: 14, fee: 150, available: true, initials: 'AK', nextSlot: 'Today, 4:30 PM', email: 'doctor@nalam360.test' },
      { id: 'doc_2', name: 'Dr. Meenakshi S.', specialty: 'Pediatrics', village: 'Karur', experience: 10, fee: 200, available: true, initials: 'MS', nextSlot: 'Tomorrow, 10:00 AM', email: 'meenakshi@nalam360.test' },
      { id: 'doc_3', name: 'Dr. Ramanathan V.', specialty: 'Cardiology', village: 'Hosur', experience: 18, fee: 350, available: true, initials: 'RV', nextSlot: 'Today, 6:00 PM', email: 'raman@nalam360.test' },
      { id: 'doc_4', name: 'Dr. Kavitha P.', specialty: 'Gynecology', village: 'Sivakasi', experience: 12, fee: 250, available: true, initials: 'KP', nextSlot: 'Tomorrow, 11:30 AM', email: 'kavitha@nalam360.test' },
      { id: 'doc_5', name: 'Dr. Murugan T.', specialty: 'Ophthalmology', village: 'Pollachi', experience: 8, fee: 180, available: false, initials: 'MT', nextSlot: 'Friday, 2:00 PM', email: 'murugan@nalam360.test' }
    ];

    var patientsList = [
      { id: 'pat_1', name: 'Muthuswamy S.', mobile: '9876543210', village: 'Melur', gender: 'Male', age: 44, primaryConcern: 'Hypertension Checkup', lastVisit: '2026-09-10' },
      { id: 'pat_2', name: 'Rajeshwari K.', mobile: '9812345678', village: 'Karur', gender: 'Female', age: 38, primaryConcern: 'Diabetes Followup', lastVisit: '2026-09-12' },
      { id: 'pat_3', name: 'Abdul B.', mobile: '9845678901', village: 'Pollachi', gender: 'Male', age: 52, primaryConcern: 'Eye Strain Screening', lastVisit: '2026-08-28' },
      { id: 'pat_4', name: 'Lakshmi M.', mobile: '9890123456', village: 'Melur', gender: 'Female', age: 29, primaryConcern: 'Pediatric Wellness for Son', lastVisit: '2026-09-01' }
    ];

    var appointmentsList = [
      { id: 'app_1', patientId: 'pat_1', patientName: 'Muthuswamy S.', doctorId: 'doc_1', doctorName: 'Dr. Arumugam K.', specialty: 'General Medicine', village: 'Melur', date: '2026-09-20', time: '10:30 AM', status: 'scheduled', token: 'NALAM-48291', notes: 'Routine blood pressure review' },
      { id: 'app_2', patientId: 'pat_2', patientName: 'Rajeshwari K.', doctorId: 'doc_1', doctorName: 'Dr. Arumugam K.', specialty: 'General Medicine', village: 'Karur', date: '2026-09-19', time: '04:00 PM', status: 'scheduled', token: 'NALAM-88123', notes: 'Blood glucose reading test' },
      { id: 'app_3', patientId: 'pat_3', patientName: 'Abdul B.', doctorId: 'doc_5', doctorName: 'Dr. Murugan T.', specialty: 'Ophthalmology', village: 'Pollachi', date: '2026-09-14', time: '02:00 PM', status: 'completed', token: 'NALAM-10482', notes: 'Prescription glasses issued' }
    ];

    var remindersList = [
      { id: 'rem_1', name: 'Metformin 500mg', slot: 'Morning', instruction: 'Take after breakfast', completed: true },
      { id: 'rem_2', name: 'Amlodipine 5mg', slot: 'Morning', instruction: 'With water after breakfast', completed: true },
      { id: 'rem_3', name: 'Multivitamin', slot: 'Afternoon', instruction: 'After lunch', completed: false },
      { id: 'rem_4', name: 'Atorvastatin 10mg', slot: 'Night', instruction: 'Before sleep', completed: false }
    ];

    var campsList = [
      { id: 'camp_1', title: 'Free Village Eye Screening Camp', village: 'Melur', date: 'Oct 24, 2026', doctor: 'Dr. Murugan T.', specialty: 'Ophthalmology', description: 'Free vision checks, cataract screenings, and prescription eyeglasses guidance for all villagers.', registeredCount: 42, isRegistered: false },
      { id: 'camp_2', title: 'Community Diabetes & BP Screening', village: 'Karur', date: 'Oct 28, 2026', doctor: 'Dr. Arumugam K.', specialty: 'General Medicine', description: 'Comprehensive blood pressure and blood sugar checks with free dietary counseling.', registeredCount: 68, isRegistered: true },
      { id: 'camp_3', title: 'Pediatric Wellness & Nutrition Camp', village: 'Sivakasi', date: 'Nov 05, 2026', doctor: 'Dr. Meenakshi S.', specialty: 'Pediatrics', description: 'Child growth monitoring, vaccination consultations, and nutritional supplement distribution.', registeredCount: 35, isRegistered: false }
    ];

    var awarenessArticlesList = [
      { id: 'art_1', title: 'Hydration During Agricultural Field Work', category: 'General Health', readTime: '3 min read', snippet: 'Essential advice for farm workers to prevent heatstroke, electrolyte imbalance, and kidney strain in hot weather.', content: 'Drink clean water at regular 30-minute intervals. Avoid excessive tea or coffee during peak sun hours. If feeling dizzy, rest under shade and consume electrolyte or fresh tender coconut water immediately.' },
      { id: 'art_2', title: 'Managing Blood Pressure Naturally', category: 'Cardiology', readTime: '4 min read', snippet: 'Practical dietary adjustments and exercise routines tailored for rural Indian lifestyles.', content: 'Reduce daily salt intake in meals. Incorporate 30 minutes of brisk morning walking. Avoid tobacco in any form and schedule BP checks once every month at your local primary health center.' },
      { id: 'art_3', title: 'Childhood Vaccination Milestones', category: 'Pediatrics', readTime: '5 min read', snippet: 'A quick reference guide for parents on mandatory vaccines from birth to 5 years.', content: 'Ensure your child receives BCG, Polio, Pentavalent, and MMR immunizations on schedule. Keep your Mother & Child Protection Card updated during primary health center visits.' }
    ];

    var emergencyContactsList = [
      { id: 'em_1', name: 'Government Medical Emergency Ambulance', number: '108', icon: 'emergency', badge: 'National Toll-Free 24/7' },
      { id: 'em_2', name: 'National Emergency Response System', number: '112', icon: 'call', badge: 'All Emergencies 24/7' }
    ];

    return {
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

      // Patients API (Doctor & Admin view)
      getPatients: function () {
        return delayedPromise(patientsList);
      },

      // Doctors CRUD
      getDoctors: function () {
        return delayedPromise(doctorsList);
      },

      getDoctorById: function (id) {
        var found = doctorsList.find(function (d) { return d.id === id; });
        return found ? delayedPromise(found) : $q.reject({ message: 'Doctor not found.' });
      },

      createDoctor: function (doctorData) {
        var newDoc = {
          id: 'doc_' + Date.now(),
          name: doctorData.name,
          specialty: doctorData.specialty,
          village: doctorData.village,
          experience: Number(doctorData.experience || 0),
          fee: Number(doctorData.fee || 0),
          available: doctorData.available !== false,
          initials: (doctorData.name || 'DR').split(' ').map(function(n){ return n[0]; }).join('').substring(0, 2).toUpperCase(),
          nextSlot: 'Available by Appointment'
        };
        doctorsList.push(newDoc);
        return delayedPromise(newDoc);
      },

      updateDoctor: function (id, doctorData) {
        var index = doctorsList.findIndex(function (d) { return d.id === id; });
        if (index !== -1) {
          angular.extend(doctorsList[index], doctorData);
          return delayedPromise(doctorsList[index]);
        }
        return $q.reject({ message: 'Doctor update failed.' });
      },

      deleteDoctor: function (id) {
        var index = doctorsList.findIndex(function (d) { return d.id === id; });
        if (index !== -1) {
          doctorsList.splice(index, 1);
          return delayedPromise({ message: 'Doctor removed from care directory.' });
        }
        return $q.reject({ message: 'Doctor deletion failed.' });
      },

      // Appointments CRUD
      getAppointments: function () {
        return delayedPromise(appointmentsList);
      },

      getDoctorAppointments: function (doctorId) {
        var docApps = appointmentsList.filter(function (a) {
          return !doctorId || a.doctorId === doctorId || a.doctorName.indexOf('Arumugam') !== -1;
        });
        return delayedPromise(docApps);
      },

      createAppointment: function (bookingData) {
        var doc = doctorsList.find(function (d) { return d.id === bookingData.doctorId; }) || { name: 'Doctor Visit', specialty: 'General' };
        var newApp = {
          id: 'app_' + Date.now(),
          patientId: 'pat_1',
          patientName: 'Muthuswamy S.',
          doctorId: bookingData.doctorId,
          doctorName: doc.name,
          specialty: doc.specialty,
          village: bookingData.village || doc.village || 'Melur',
          date: bookingData.date,
          time: bookingData.time,
          status: 'scheduled',
          token: 'NALAM-' + Math.floor(10000 + Math.random() * 90000),
          notes: bookingData.notes || 'Consultation request'
        };
        appointmentsList.unshift(newApp);
        return delayedPromise(newApp);
      },

      updateAppointmentStatus: function (id, status) {
        var app = appointmentsList.find(function (a) { return a.id === id; });
        if (app) {
          app.status = status;
          return delayedPromise(app);
        }
        return $q.reject({ message: 'Appointment not found.' });
      },

      cancelAppointment: function (id) {
        return this.updateAppointmentStatus(id, 'cancelled');
      },

      // Reminders CRUD
      getReminders: function () {
        return delayedPromise(remindersList);
      },

      createReminder: function (reminderData) {
        var newRem = {
          id: 'rem_' + Date.now(),
          name: reminderData.name,
          slot: reminderData.slot || 'Morning',
          instruction: reminderData.instruction || 'Take with water',
          completed: false
        };
        remindersList.unshift(newRem);
        return delayedPromise(newRem);
      },

      toggleReminderComplete: function (id) {
        var rem = remindersList.find(function (r) { return r.id === id; });
        if (rem) {
          rem.completed = !rem.completed;
          return delayedPromise(rem);
        }
        return $q.reject({ message: 'Reminder not found.' });
      },

      deleteReminder: function (id) {
        var index = remindersList.findIndex(function (r) { return r.id === id; });
        if (index !== -1) {
          remindersList.splice(index, 1);
          return delayedPromise({ message: 'Reminder deleted.' });
        }
        return $q.reject({ message: 'Reminder deletion failed.' });
      },

      // Health Camps CRUD
      getCamps: function () {
        return delayedPromise(campsList);
      },

      createCamp: function (campData) {
        var newCamp = {
          id: 'camp_' + Date.now(),
          title: campData.title,
          village: campData.village,
          date: campData.date,
          doctor: campData.doctor || 'Dr. Arumugam K.',
          specialty: campData.specialty || 'General Medicine',
          description: campData.description,
          registeredCount: 0,
          isRegistered: false
        };
        campsList.unshift(newCamp);
        return delayedPromise(newCamp);
      },

      deleteCamp: function (id) {
        var index = campsList.findIndex(function (c) { return c.id === id; });
        if (index !== -1) {
          campsList.splice(index, 1);
          return delayedPromise({ message: 'Camp removed.' });
        }
        return $q.reject({ message: 'Camp deletion failed.' });
      },

      registerCampInterest: function (id) {
        var camp = campsList.find(function (c) { return c.id === id; });
        if (camp) {
          camp.isRegistered = !camp.isRegistered;
          camp.registeredCount += camp.isRegistered ? 1 : -1;
          return delayedPromise(camp);
        }
        return $q.reject({ message: 'Camp not found.' });
      },

      // Awareness
      getAwarenessArticles: function () {
        return delayedPromise(awarenessArticlesList);
      },

      // Emergency
      getEmergencyContacts: function () {
        return delayedPromise(emergencyContactsList);
      },

      // Summaries
      getPatientSummary: function () {
        return delayedPromise({
          appointments: appointmentsList.length,
          reminders: remindersList.length,
          completedDoses: remindersList.filter(function(r){ return r.completed; }).length
        });
      },

      getDoctorSummary: function () {
        return delayedPromise({
          todayConsultations: appointmentsList.filter(function(a){ return a.status === 'scheduled'; }).length,
          totalPatients: patientsList.length,
          completedVisits: appointmentsList.filter(function(a){ return a.status === 'completed'; }).length,
          activeCamps: campsList.length
        });
      },

      getAdminSummary: function () {
        return delayedPromise({
          users: patientsList.length + doctorsList.length + 1,
          doctors: doctorsList.length,
          appointments: appointmentsList.length,
          reminders: remindersList.length,
          camps: campsList.length
        });
      }
    };
  }]);
})();
