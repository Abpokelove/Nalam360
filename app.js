(function () {
  'use strict';

  var app = angular.module('Nalam360App', ['ngAnimate']);

  app.factory('ApiFactory', ['$http', function ($http) {
    function request(method, url, data) {
      var token = window.localStorage.getItem('nalam_token');
      return $http({ method: method, url: url, data: data, headers: token ? { Authorization: 'Bearer ' + token } : {} }).then(function (response) { return response.data; });
    }
    return {
      register: function (data) { return request('POST', '/api/auth/register', data); },
      login: function (data) { return request('POST', '/api/auth/login', data); },
      me: function () { return request('GET', '/api/auth/me'); },
      updateProfile: function (data) { return request('PUT', '/api/auth/me', data); },
      doctors: function () { return request('GET', '/api/doctors'); },
      createDoctor: function (data) { return request('POST', '/api/doctors', data); },
      updateDoctor: function (id, data) { return request('PUT', '/api/doctors/' + id, data); },
      deleteDoctor: function (id) { return request('DELETE', '/api/doctors/' + id); },
      appointments: function () { return request('GET', '/api/appointments'); },
      createAppointment: function (data) { return request('POST', '/api/appointments', data); },
      updateAppointment: function (id, data) { return request('PUT', '/api/appointments/' + id, data); },
      deleteAppointment: function (id) { return request('DELETE', '/api/appointments/' + id); },
      reminders: function () { return request('GET', '/api/reminders'); },
      createReminder: function (data) { return request('POST', '/api/reminders', data); },
      updateReminder: function (id, data) { return request('PUT', '/api/reminders/' + id, data); },
      deleteReminder: function (id) { return request('DELETE', '/api/reminders/' + id); },
      summary: function () { return request('GET', '/api/admin/summary'); }
    };
  }]);

<<<<<<< Updated upstream
app.service("NalamSessionService", ["$window", function($window) {
    this.getActiveProfile = function() {
        var profiles = angular.fromJson($window.localStorage.getItem("nalam_profiles") || "[]");
        var index = parseInt($window.localStorage.getItem("nalam_active_index") || "0", 10);
        return profiles[index] || null;
    };

    this.saveValue = function(key, value) {
        $window.localStorage.setItem(key, angular.toJson(value));
    };
}]);

app.controller("AppointmentController", ["$window", function($window) {
    var vm = this;
    vm.booking = { careType: "", date: null, time: null, people: 1, reason: "", language: "Tamil" };
    vm.isSubmitted = false;

    vm.submitBooking = function() { vm.isSubmitted = true; };
    vm.closeModal = function() { vm.isSubmitted = false; };
    vm.resetForm = function() {
        vm.booking = { careType: "", date: null, time: null, people: 1, reason: "", language: "Tamil" };
    };
}]);

app.controller("DoctorController", ["HealthcareService", function(HealthcareService) {
    var vm = this;
    vm.searchQuery = "";
    vm.specialityFilter = "";
    vm.doctors = HealthcareService.getDoctors().map(function(doctor) {
        return {
            name: doctor.name,
            initials: doctor.initials,
            speciality: doctor.specialty,
            exp: doctor.exp + " years",
            langs: "Tamil, English",
            next: doctor.available ? "Today, 4:30 PM" : "Tomorrow, 10:00 AM"
        };
    });
}]);

app.controller("ReminderController", ["NalamSessionService", function(NalamSessionService) {
    var vm = this;
    vm.isModalOpen = false;
    vm.newReminder = { text: "", time: null };
    vm.reminders = [
        { time: "8:00 AM", text: "Morning medication", status: "Done", cssClass: "status" },
        { time: "2:00 PM", text: "Drink water / lunch", status: "Upcoming", cssClass: "status warn" },
        { time: "7:30 PM", text: "Prepare reports", status: "Upcoming", cssClass: "status warn" }
    ];
    vm.profileReady = !!NalamSessionService.getActiveProfile();

    vm.openModal = function() { vm.isModalOpen = true; };
    vm.closeModal = function() {
        vm.isModalOpen = false;
        vm.newReminder = { text: "", time: null };
    };
    vm.addReminder = function() {
        if (vm.newReminder.text) {
            vm.reminders.push({
                time: vm.newReminder.time || "TBD",
                text: vm.newReminder.text,
                status: "Upcoming",
                cssClass: "status warn"
            });
            vm.closeModal();
        }
    };
}]);

app.filter("nalamInitials", function() {
    return function(value) {
        if (!value) return "NA";
        return value.split(/\s+/).map(function(word) { return word.charAt(0); }).join("").substring(0, 2).toUpperCase();
    };
});

app.directive("nalamPage", ["NalamSessionService", function(NalamSessionService) {
    return {
        restrict: "A",
        link: function(scope, element) {
            element.addClass("nalam-page-ready");
            element.attr("data-profile", NalamSessionService.getActiveProfile() ? "ready" : "new");
        }
    };
}]);

app.directive("nalamNavigation", function() {
    return {
        restrict: "A",
        template:
            '<button class="nalam-menu-button" type="button" aria-label="Open navigation" ng-click="navOpen = true"><span class="material-symbols-outlined">menu</span></button>' +
            '<div class="nalam-nav-backdrop" ng-if="navOpen" ng-click="navOpen = false"></div>' +
            '<aside class="nalam-navigation" ng-class="{\'is-open\': navOpen}">' +
                '<div class="nalam-navigation__brand"><strong>Nalam360</strong><span>Patient Portal</span></div>' +
                '<nav class="nalam-navigation__links" aria-label="Patient portal navigation">' +
                    '<a ng-repeat="page in pageLinks" ng-href="{{page.url}}" ng-class="{\'is-active\': currentPage === page.url}" ng-click="navOpen = false"><span class="material-symbols-outlined">{{page.icon}}</span><span>{{page.name}}</span></a>' +
                '</nav>' +
                '<div class="nalam-navigation__footer"><button type="button" ng-click="toggleEmergencyPanel(); navOpen = false"><span class="material-symbols-outlined">emergency</span><span>Emergency Contacts</span></button><a href="index.html"><span class="material-symbols-outlined">logout</span><span>Logout</span></a></div>' +
            '</aside>',
        link: function(scope) {
            scope.navOpen = false;
            scope.pageLinks = [
                { name: "Dashboard", url: "dashboard.html", icon: "dashboard" },
                { name: "Find Healthcare", url: "healthcare.html", icon: "map" },
                { name: "Doctors", url: "doctors.html", icon: "medical_services" },
                { name: "Health Camps", url: "HealthCamp.html", icon: "campaign" },
                { name: "Appointments", url: "ReferralsAndReminder.html", icon: "event" },
                { name: "Referrals", url: "referrals.html", icon: "share" },
                { name: "Awareness", url: "HealthAwareness.html", icon: "menu_book" },
                { name: "Emergency", url: "EmergencyAssistance.html", icon: "emergency" },
                { name: "Profile", url: "profile.html", icon: "person" },
                { name: "Support", url: "ProfileandSupport.html", icon: "support_agent" }
            ];
        }
    };
});

// <!-- AngularJS Controller -->
app.controller("Nalam360Ctrl", ["$scope", "$controller", function($scope, $controller) {
    $controller("PatientController", { $scope: $scope });
}]);

// <!-- Dependency Injection -->
app.controller("PatientController", ["$scope", "HealthcareService", "NalamSessionService", "$filter", "$timeout", "$interval", function($scope, HealthcareService, NalamSessionService, $filter, $timeout, $interval) {

    $scope.pageLinks = [
        { name: "Dashboard", url: "dashboard.html" },
        { name: "Find Healthcare", url: "healthcare.html" },
        { name: "Doctors", url: "doctors.html" },
        { name: "Health Camps", url: "HealthCamp.html" },
        { name: "Appointments", url: "ReferralsAndReminder.html" },
        { name: "Referrals", url: "referrals.html" },
        { name: "Awareness", url: "HealthAwareness.html" },
        { name: "Emergency", url: "EmergencyAssistance.html" },
        { name: "Profile", url: "profile.html" },
        { name: "Support", url: "ProfileandSupport.html" }
=======
  app.service('AuthService', ['$window', '$q', 'ApiFactory', function ($window, $q, ApiFactory) {
    var state = { user: null, token: $window.localStorage.getItem('nalam_token') };
    function headers() {
      return state.token ? { Authorization: 'Bearer ' + state.token } : {};
    }
    return {
      state: state,
      headers: headers,
      login: function (credentials) { return ApiFactory.login(credentials).then(function (result) { state.user = result.user; state.token = result.token; $window.localStorage.setItem('nalam_token', result.token); return result; }); },
      register: function (data) { return ApiFactory.register(data); },
      restore: function () { return state.token ? ApiFactory.me().then(function (result) { state.user = result.user; return result.user; }) : $q.reject(); },
      logout: function () { state.user = null; state.token = null; $window.localStorage.removeItem('nalam_token'); $window.location.href = 'login.html'; },
      isLoggedIn: function () { return !!state.token && !!state.user; }
    };
  }]);

  app.service('NotificationService', ['$timeout', function ($timeout) {
    var state = { message: '', type: 'success' };
    return { state: state, show: function (message, type) { state.message = message; state.type = type || 'success'; $timeout(function () { state.message = ''; }, 3500); } };
  }]);

  app.filter('statusLabel', function () { return function (value) { return String(value || '').replace(/^./, function (letter) { return letter.toUpperCase(); }); }; });
  app.filter('initials', function () { return function (value) { return String(value || 'Nalam').split(' ').map(function (part) { return part.charAt(0); }).join('').substring(0, 2).toUpperCase(); }; });
  app.filter('length', function () { return function (value) { return value ? value.length : 0; }; });
  app.directive('statusPill', function () { return { restrict: 'E', scope: { value: '@' }, template: '<span class="status-pill" ng-class="value">{{ value | statusLabel }}</span>' }; });

  app.controller('AppController', ['$scope', '$location', 'AuthService', 'NotificationService', function ($scope, $location, AuthService, NotificationService) {
    $scope.auth = AuthService;
    $scope.notice = NotificationService.state;
    $scope.mobileOpen = false;
    $scope.page = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    if ($scope.page !== 'index' && $scope.page !== 'login' && $scope.page !== 'register' && !AuthService.state.token) {
      window.location.href = 'login.html';
      return;
    }
    if (AuthService.state.token) {
      AuthService.restore().catch(function () {
        AuthService.logout();
      });
    }
    $scope.navItems = [
      { label: 'Overview', icon: 'dashboard', page: 'dashboard', roles: ['patient', 'admin'] },
      { label: 'Find care', icon: 'medical_services', page: 'healthcare', roles: ['patient', 'admin'] },
      { label: 'Appointments', icon: 'event', page: 'appointment', roles: ['patient', 'admin'] },
      { label: 'Medication', icon: 'medication', page: 'referrals', roles: ['patient', 'admin'] },
      { label: 'Health camps', icon: 'campaign', page: 'HealthCamp', roles: ['patient', 'admin'] },
      { label: 'Emergency', icon: 'emergency', page: 'EmergencyAssistance', roles: ['patient', 'admin'] },
      { label: 'Profile', icon: 'person', page: 'profile', roles: ['patient', 'admin'] },
      { label: 'Admin workspace', icon: 'admin_panel_settings', page: 'doctor', roles: ['admin'] }
>>>>>>> Stashed changes
    ];
    $scope.isVisible = function (item) { return !$scope.auth.state.user || item.roles.indexOf($scope.auth.state.user.role) !== -1; };
    $scope.isActive = function (item) { return $scope.page.toLowerCase() === item.page.toLowerCase(); };
    $scope.go = function (page) { window.location.href = page + '.html'; };
    $scope.logout = function () { AuthService.logout(); };
    $scope.toggleMobile = function () { $scope.mobileOpen = !$scope.mobileOpen; };
  }]);

  app.controller('AuthController', ['$scope', '$timeout', 'AuthService', 'NotificationService', function ($scope, $timeout, AuthService, NotificationService) {
    $scope.form = {};
    $scope.loading = false;
    $scope.submitLogin = function () {
      if (!$scope.loginForm.$valid) return;
      $scope.loading = true;
      AuthService.login($scope.form).then(function (result) { window.location.href = result.user.role === 'admin' ? 'doctor.html' : 'dashboard.html'; }, function (error) { NotificationService.show((error.data && error.data.message) || 'Login failed.', 'error'); }).finally(function () { $scope.loading = false; });
    };
<<<<<<< Updated upstream

    updateCurrentPage();
    window.addEventListener("hashchange", updateCurrentPage);
    $scope.activeProfileFromService = NalamSessionService.getActiveProfile();

    $scope.toggleSidebar = function() {
        $scope.mobileSidebarOpen = !$scope.mobileSidebarOpen;
=======
    $scope.submitRegister = function () {
      if (!$scope.registerForm.$valid) return;
      $scope.loading = true;
      AuthService.register($scope.form).then(function () { NotificationService.show('Account created. Please login.', 'success'); $timeout(function () { window.location.href = 'login.html'; }, 800); }, function (error) { NotificationService.show((error.data && error.data.message) || 'Registration failed.', 'error'); }).finally(function () { $scope.loading = false; });
>>>>>>> Stashed changes
    };
  }]);

  app.controller('DashboardController', ['$scope', '$q', 'ApiFactory', 'AuthService', 'NotificationService', function ($scope, $q, ApiFactory, AuthService, NotificationService) {
    $scope.loading = true; $scope.appointments = []; $scope.reminders = [];
    $q.all([ApiFactory.appointments(), ApiFactory.reminders()]).then(function (data) { $scope.appointments = data[0]; $scope.reminders = data[1]; }, function () { NotificationService.show('Could not load your dashboard data.', 'error'); }).finally(function () { $scope.loading = false; });
    $scope.user = AuthService.state.user;
    $scope.toggleReminder = function (item) { ApiFactory.updateReminder(item._id, { completed: !item.completed }).then(function (updated) { item.completed = updated.completed; NotificationService.show('Medication status updated.'); }, function () { NotificationService.show('Could not update medication.', 'error'); }); };
  }]);

  app.controller('HealthcareController', ['$scope', '$q', 'ApiFactory', 'NotificationService', function ($scope, $q, ApiFactory, NotificationService) {
    $scope.loading = true; $scope.doctors = []; $scope.search = ''; $scope.selected = null; $scope.booking = {};
    ApiFactory.doctors().then(function (data) { $scope.doctors = data; }, function () { NotificationService.show('Could not load doctors.', 'error'); }).finally(function () { $scope.loading = false; });
    $scope.openBooking = function (doctor) { $scope.selected = doctor; $scope.booking = {}; };
    $scope.book = function () { if (!$scope.bookingForm.$valid) return; ApiFactory.createAppointment({ doctorId: $scope.selected._id, date: $scope.booking.date, time: $scope.booking.time }).then(function () { NotificationService.show('Appointment booked successfully.'); $scope.selected = null; }, function (error) { NotificationService.show((error.data && error.data.message) || 'Booking failed.', 'error'); }); };
  }]);

  app.controller('AppointmentController', ['$scope', 'ApiFactory', 'NotificationService', function ($scope, ApiFactory, NotificationService) {
    $scope.loading = true; $scope.appointments = [];
    ApiFactory.appointments().then(function (data) { $scope.appointments = data; }, function () { NotificationService.show('Could not load appointments.', 'error'); }).finally(function () { $scope.loading = false; });
    $scope.cancel = function (item) { if (!window.confirm('Cancel this appointment?')) return; ApiFactory.updateAppointment(item._id, { status: 'cancelled' }).then(function () { item.status = 'cancelled'; NotificationService.show('Appointment cancelled.'); }, function () { NotificationService.show('Could not cancel appointment.', 'error'); }); };
  }]);

  app.controller('ReminderController', ['$scope', 'ApiFactory', 'NotificationService', function ($scope, ApiFactory, NotificationService) {
    $scope.loading = true; $scope.reminders = []; $scope.form = {};
    ApiFactory.reminders().then(function (data) { $scope.reminders = data; }, function () { NotificationService.show('Could not load reminders.', 'error'); }).finally(function () { $scope.loading = false; });
    $scope.create = function () { if (!$scope.reminderForm.$valid) return; ApiFactory.createReminder($scope.form).then(function (item) { $scope.reminders.unshift(item); $scope.form = {}; $scope.reminderForm.$setPristine(); NotificationService.show('Reminder added.'); }, function () { NotificationService.show('Could not add reminder.', 'error'); }); };
    $scope.remove = function (item) { if (!window.confirm('Delete this reminder?')) return; ApiFactory.deleteReminder(item._id).then(function () { $scope.reminders.splice($scope.reminders.indexOf(item), 1); NotificationService.show('Reminder deleted.'); }, function () { NotificationService.show('Could not delete reminder.', 'error'); }); };
  }]);

  app.controller('AdminController', ['$scope', '$q', 'ApiFactory', 'NotificationService', function ($scope, $q, ApiFactory, NotificationService) {
    $scope.loading = true; $scope.doctors = []; $scope.summary = {}; $scope.form = {}; $scope.editing = null;
    $q.all([ApiFactory.doctors(), ApiFactory.summary()]).then(function (data) { $scope.doctors = data[0]; $scope.summary = data[1]; }, function (error) { NotificationService.show((error.data && error.data.message) || 'Admin data unavailable.', 'error'); }).finally(function () { $scope.loading = false; });
    $scope.save = function () { if (!$scope.doctorForm.$valid) return; var action = $scope.editing ? ApiFactory.updateDoctor($scope.editing._id, $scope.form) : ApiFactory.createDoctor($scope.form); action.then(function (item) { if ($scope.editing) { $scope.doctors[$scope.doctors.indexOf($scope.editing)] = item; } else { $scope.doctors.push(item); } $scope.form = {}; $scope.editing = null; NotificationService.show('Doctor saved.'); }, function () { NotificationService.show('Could not save doctor.', 'error'); }); };
    $scope.edit = function (item) { $scope.editing = item; $scope.form = angular.copy(item); };
    $scope.remove = function (item) { if (!window.confirm('Delete this doctor?')) return; ApiFactory.deleteDoctor(item._id).then(function () { $scope.doctors.splice($scope.doctors.indexOf(item), 1); NotificationService.show('Doctor deleted.'); }, function () { NotificationService.show('Could not delete doctor.', 'error'); }); };
  }]);

<<<<<<< Updated upstream
    // Load active appointments list
    var initialAppointments = [
        {
            docId: 3,
            docName: "Dr. Karthik Raja",
            docSpecialty: "Cardiologist",
            docInitials: "KR",
            docGradient: "from-red-500 to-rose-600",
            date: "2024-10-14",
            time: "10:30 AM",
            token: "NALAM-78921"
        }
    ];
    if (!localStorage.getItem("nalam_appointments")) {
        localStorage.setItem("nalam_appointments", angular.toJson(initialAppointments));
    }
    $scope.appointmentsList = angular.fromJson(localStorage.getItem("nalam_appointments"));
    $scope.hasAppointment = $scope.appointmentsList.length > 0;
    $scope.appointment = $scope.appointmentsList[0];

    // Load customized medicine list (Reminders checklist)
    if (!localStorage.getItem("nalam_medicines")) {
        localStorage.setItem("nalam_medicines", angular.toJson(HealthcareService.getMedicines()));
    }
    $scope.medicineList = angular.fromJson(localStorage.getItem("nalam_medicines"));

    // Registered camps tracking list
    if (!localStorage.getItem("nalam_registered_camps")) {
        localStorage.setItem("nalam_registered_camps", angular.toJson([]));
    }
    $scope.registeredCampIds = angular.fromJson(localStorage.getItem("nalam_registered_camps"));

    // Services static data
    $scope.villages = HealthcareService.getVillages();
    $scope.doctors = HealthcareService.getDoctors();
    $scope.hospitals = HealthcareService.getHospitals();
    $scope.emergencyContacts = HealthcareService.getEmergencyContacts().map(function(contact, index) {
        return angular.extend(contact, {
            phone: contact.number,
            initials: contact.name.split(/\s+/).map(function(word) { return word.charAt(0); }).join("").substring(0, 2),
            color: index % 2 ? "bg-secondary text-white" : "bg-primary-fixed text-primary"
        });
    });
    $scope.healthCamps = HealthcareService.getHealthCamps();

    $scope.campFilters = { village: "All Villages", search: "", campType: "All Types" };
    $scope.healthCamps = $scope.healthCamps.map(function(camp) {
        return angular.extend(camp, {
            badge: camp.slots > 0 ? "Open for registration" : "Fully booked",
            coverage: camp.location,
            place: camp.location,
            tags: [camp.type, camp.village],
            status: camp.slots > 0 ? "Register Free Now" : "Join waitlist",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80"
        });
    });
    $scope.filteredCamps = function() {
        var filters = $scope.campFilters;
        return $scope.healthCamps.filter(function(camp) {
            var matchesVillage = filters.village === "All Villages" || camp.village === filters.village;
            var matchesType = filters.campType === "All Types" || camp.type === filters.campType;
            var query = (filters.search || "").toLowerCase();
            return matchesVillage && matchesType && (!query || (camp.title + " " + camp.location).toLowerCase().indexOf(query) !== -1);
        });
    };

    $scope.awarenessLanguage = "en";
    $scope.selectedCategory = "All Topics";
    $scope.awarenessSearch = "";
    $scope.awarenessText = {
        headerTitle: "Health Awareness Library", headerSubtitle: "Practical guidance for healthier village communities.",
        searchPlaceholder: "Search health topics...", allTopics: "All Topics", categories: ["Nutrition", "Hygiene", "Vaccination", "Seasonal Health"],
        specialPanelTitle: "Prevent seasonal illness", specialPanelBody: "Learn simple ways to protect your family during changing weather.", readMore: "Read more", learnBasics: "Learn basics", readArticle: "Read article", featuredTag: "Featured guide", featuredTime: "5 min read", doLabel: "Do", dontLabel: "Avoid", keyTakeaways: "Key takeaways", sourceLabel: "Source", sourceText: "Nalam360 Community Health Team", footerTitle: "Trusted health information", footerText: "Clear, local, practical advice for every family.",
        cardMap: {
            dengue: { title: "Protect against dengue", description: "Reduce mosquito breeding around your home.", category: "Seasonal Health", content: "Remove standing water, use screens and seek care for persistent fever." },
            vaccination: { title: "Vaccination basics", description: "Keep children and adults protected with timely vaccines.", category: "Vaccination", content: "Keep your family vaccination records updated and ask your health worker about due dates." }
        }
    };
    $scope.awarenessCards = [
        { key: "dengue", category: "Seasonal Health", title: "Protect against dengue", description: "Reduce mosquito breeding around your home.", image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80" },
        { key: "nutrition", category: "Nutrition", title: "Build a balanced plate", description: "Use local grains, greens and pulses for daily nutrition.", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80" },
        { key: "hygiene", category: "Hygiene", title: "Clean hands, safer homes", description: "Wash hands before meals and after outdoor work.", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=900&q=80" },
        { key: "vaccination", category: "Vaccination", title: "Vaccination basics", description: "Keep children and adults protected with timely vaccines.", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80" }
    ];
    $scope.featuredArticle = angular.copy($scope.awarenessCards[0]);
    $scope.setAwarenessLanguage = function(language) { $scope.awarenessLanguage = language; };
    $scope.filterAwarenessByCategory = function(category) { $scope.selectedCategory = category; };
    $scope.setAwarenessArticle = function(article) { $scope.featuredArticle = article; };

    $scope.emergencyLocations = [
        { id: 1, name: "Hosur Emergency Zone", center: "Civil Hospital Hosur", coords: "12.7409 N, 77.8253 E", distance: "2.4 km", eta: "8 min", emergencyNote: "Open 24/7 with ambulance support.", actionText: "Get directions", services: ["Ambulance", "Trauma care", "Pharmacy"], mapImage: "https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&w=900&q=80" },
        { id: 2, name: "Melur Emergency Zone", center: "Nalam PHC Center Melur", coords: "10.0324 N, 78.3398 E", distance: "0.8 km", eta: "4 min", emergencyNote: "Primary care and rapid referral available.", actionText: "Get directions", services: ["First aid", "Ambulance", "Observation"], mapImage: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80" }
    ];
    $scope.selectedEmergencyLocation = $scope.emergencyLocations[0];
    $scope.selectEmergencyLocation = function(location) { $scope.selectedEmergencyLocation = location; };
    $scope.firstAidGuides = [{ title: "Bleeding", icon: "healing", iconClass: "text-error", steps: ["Apply firm pressure with clean cloth.", "Keep the injured area raised.", "Call 112 if bleeding continues."] }, { title: "Burns", icon: "local_fire_department", iconClass: "text-error", steps: ["Cool under clean running water.", "Remove tight items near the burn.", "Do not apply oils or creams."] }];
    $scope.selectedGuide = null;
    $scope.showGuide = function(guide) { $scope.selectedGuide = guide; };
    $scope.selectEmergencyContact = function(contact) { $scope.emergencyStatus = "Calling " + contact.name + " at " + contact.phone + "."; };

    $scope.patient.id = $scope.patient.id || "NALAM-" + ($scope.activeProfileIndex + 1).toString().padStart(3, "0");
    $scope.patient.status = $scope.patient.status || "Verified patient";
    $scope.patient.language = $scope.patient.language || "Tamil";
    $scope.patient.lastSync = $scope.patient.lastSync || "Just now";
    $scope.profileForm = angular.copy($scope.patient);
    $scope.showProfileEditor = false;
    $scope.profileSaveStatus = "";
    $scope.toggleProfileEditor = function() { $scope.showProfileEditor = !$scope.showProfileEditor; };

    $scope.activeTab = "reports";
    $scope.referralItems = [{ title: "Blood test report", detail: "Uploaded 18 Jul 2026" }, { title: "Specialist referral", detail: "Reviewed by Dr. Mozhi" }];
    $scope.notes = ["Blood pressure is improving.", "Continue current medication schedule.", "Follow up after laboratory review."];
    $scope.switchTab = function(tab) { $scope.activeTab = tab; };
    $scope.endConsultation = function() { window.location.href = "ReferralsAndReminder.html"; };
    
    // Add registration state indicator to camps dynamically
    angular.forEach($scope.healthCamps, function(camp) {
        camp.registered = $scope.registeredCampIds.indexOf(camp.id) !== -1;
    });

    // 2. Profile Management
    $scope.switchProfile = function() {
        localStorage.setItem("nalam_active_index", $scope.activeProfileIndex);
        $scope.patient = $scope.profiles[$scope.activeProfileIndex];
        $scope.patient.dob = new Date($scope.patient.dob);
        $scope.patient.id = $scope.patient.id || "NALAM-" + ($scope.activeProfileIndex + 1).toString().padStart(3, "0");
        $scope.patient.status = $scope.patient.status || "Verified patient";
        $scope.patient.language = $scope.patient.language || "Tamil";
        $scope.patient.lastSync = $scope.patient.lastSync || "Just now";
        $scope.profileForm = angular.copy($scope.patient);
        $scope.generateNextTip(); // Refresh Tip relative to new profile
    };

    $scope.saveProfile = function() {
        if ($scope.profileForm && $scope.showProfileEditor) {
            $scope.patient = angular.extend($scope.patient, $scope.profileForm);
            $scope.showProfileEditor = false;
            $scope.profileSaveStatus = "Profile updated successfully.";
        }
        if ($scope.patient.name) {
            // Update initials dynamically
            var words = $scope.patient.name.split(' ');
            var initials = "";
            angular.forEach(words, function(w) {
                if (w) initials += w[0].toUpperCase();
            });
            $scope.patient.initials = initials.substring(0, 2) || "A";
            
            // Update current list index
            $scope.profiles[$scope.activeProfileIndex] = $scope.patient;
            localStorage.setItem("nalam_profiles", angular.toJson($scope.profiles));
            $scope.feedbackMessage = "✔ Profile updated successfully! Changes saved to database.";
            $timeout(function() { $scope.feedbackMessage = ""; }, 3000);
        }
    };

    // 3. Current Time Clock ($interval DI)
    $scope.systemTime = new Date();
    $interval(function() {
        $scope.systemTime = new Date();
    }, 1000);

    // 4. Daily Health Tip ($timeout & HealthcareService)
    var tips = HealthcareService.getHealthTips();
    $scope.activeTip = tips[0];
    $scope.tipText = "Loading daily community health advice...";
    $timeout(function() {
        $scope.tipText = tips[0];
    }, 1200);

    $scope.generateNextTip = function() {
        var index = Math.floor(Math.random() * tips.length);
        $scope.activeTip = tips[index];
        $scope.tipText = tips[index];
    };

    // 5. GPS Location Selector Simulation ($timeout DI)
    $scope.locationButtonText = "Auto-Detect Location";
    $scope.searchFilters = {
        query: "",
        location: ""
    };
    $scope.fetchCurrentLocation = function() {
        $scope.locationButtonText = "Locating via GPS...";
        $timeout(function() {
            // Simulate detection of Melur
            $scope.searchFilters.location = "Melur";
            $scope.locationButtonText = "Active: Melur Village";
        }, 1500);
    };

    $scope.resetFilters = function() {
        $scope.searchFilters = {
            query: "",
            location: ""
        };
        $scope.locationButtonText = "Auto-Detect Location";
        $scope.doctorSortKey = "name";
    };

    // 6. Directives Demonstration Configurations (for Laboratory Panels)
    $scope.showEvaluatorConsole = false;
    $scope.directivesDemo = {
        showBanner: true,
        showEmergencyCard: false,
        themeClass: 'bg-primary-container/10 text-primary border-primary/20',
        isDisabled: false,
        isReadonly: true,
        borderWidth: 2,
        switchTab: 'binding',
        toggleBanner: function() {
            $scope.directivesDemo.showBanner = !$scope.directivesDemo.showBanner;
        }
    };

    // 7. Interactive Filtering State
    $scope.doctorSortKey = "name";
    $scope.medicineSortKey = "name";

    // 8. Custom Medicine Reminders Addition / Removal
    $scope.showAddReminderForm = false;
    $scope.newMed = { name: "", slot: "", instruction: "", price: 20 };
    $scope.dosageStatuses = {
        Morning: false,
        Afternoon: false,
        Night: false
    };

    $scope.toggleReminderForm = function() {
        $scope.showAddReminderForm = !$scope.showAddReminderForm;
    };

    $scope.addReminder = function() {
        if ($scope.newMed.name && $scope.newMed.slot) {
            $scope.medicineList.push({
                name: $scope.newMed.name,
                slot: $scope.newMed.slot,
                instruction: $scope.newMed.instruction || "As directed",
                price: parseFloat($scope.newMed.price || 0)
            });
            localStorage.setItem("nalam_medicines", angular.toJson($scope.medicineList));
            $scope.newMed = { name: "", slot: "", instruction: "", price: 20 };
            $scope.showAddReminderForm = false;
            $scope.feedbackMessage = "✔ Medicine added successfully!";
            $timeout(function() { $scope.feedbackMessage = ""; }, 2500);
        }
    };

    $scope.removeReminder = function(med) {
        var index = $scope.medicineList.indexOf(med);
        if (index > -1) {
            $scope.medicineList.splice(index, 1);
            localStorage.setItem("nalam_medicines", angular.toJson($scope.medicineList));
            $scope.feedbackMessage = "✖ Medicine reminder deleted.";
            $timeout(function() { $scope.feedbackMessage = ""; }, 2500);
        }
    };

    $scope.markDosageTaken = function(slot) {
        $scope.dosageStatuses[slot] = true;
    };

    $scope.resetDosageStatuses = function() {
        $scope.dosageStatuses.Morning = false;
        $scope.dosageStatuses.Afternoon = false;
        $scope.dosageStatuses.Night = false;
    };

    // 9. Interactive Referral Progress Bar
    $scope.referralStep = 3;
    $scope.setReferralStep = function(step) {
        $scope.referralStep = step;
    };

    // 10. Dashboard & Layout Toggles
    $scope.mobileSidebarOpen = false;
    $scope.showPatientDetails = false;
    $scope.showEmergencyPanel = false;

    $scope.toggleMobileSidebar = function() {
        $scope.mobileSidebarOpen = !$scope.mobileSidebarOpen;
    };
    $scope.togglePatientDetails = function() {
        $scope.showPatientDetails = !$scope.showPatientDetails;
    };
    $scope.toggleEmergencyPanel = function() {
        $scope.showEmergencyPanel = !$scope.showEmergencyPanel;
    };

    // 11. Appointment Booking Logic
    $scope.bookingModal = {
        visible: false,
        doctor: null,
        date: "",
        time: "",
        loading: false,
        token: ""
    };

    $scope.openBookingModal = function(doctor) {
        $scope.bookingModal.doctor = doctor;
        $scope.bookingModal.visible = true;
        $scope.bookingModal.token = "";
        $scope.bookingModal.loading = false;
        $scope.bookingModal.date = "";
        $scope.bookingModal.time = "";
    };

    $scope.closeBookingModal = function() {
        $scope.bookingModal.visible = false;
    };

    $scope.confirmBooking = function() {
        if ($scope.bookingModal.date && $scope.bookingModal.time) {
            $scope.bookingModal.loading = true;
            $timeout(function() {
                $scope.bookingModal.loading = false;
                var randNum = Math.floor(10000 + Math.random() * 90000);
                var token = "NALAM-" + randNum;
                $scope.bookingModal.token = token;

                // Save to appointment list
                var newAppt = {
                    docId: $scope.bookingModal.doctor.id,
                    docName: $scope.bookingModal.doctor.name,
                    docSpecialty: $scope.bookingModal.doctor.specialty,
                    docInitials: $scope.bookingModal.doctor.initials,
                    docGradient: $scope.bookingModal.doctor.bgGradient,
                    date: $filter('date')($scope.bookingModal.date, 'yyyy-MM-dd'),
                    time: $scope.bookingModal.time,
                    token: token
                };
                
                $scope.appointmentsList.unshift(newAppt);
                localStorage.setItem("nalam_appointments", angular.toJson($scope.appointmentsList));
                
                // Update bindings
                $scope.appointmentsList = angular.fromJson(localStorage.getItem("nalam_appointments"));
                $scope.appointment = $scope.appointmentsList[0];
                $scope.hasAppointment = true;

            }, 1200);
        }
    };

    $scope.cancelAppointment = function(appt) {
        var index = $scope.appointmentsList.indexOf(appt);
        if (index > -1) {
            $scope.appointmentsList.splice(index, 1);
            localStorage.setItem("nalam_appointments", angular.toJson($scope.appointmentsList));
            $scope.appointmentsList = angular.fromJson(localStorage.getItem("nalam_appointments"));
            $scope.hasAppointment = $scope.appointmentsList.length > 0;
            if ($scope.hasAppointment) {
                $scope.appointment = $scope.appointmentsList[0];
            }
            alert("Appointment successfully cancelled.");
        }
    };

    // 12. Health Camp Registration
    $scope.registerCamp = function(camp) {
        if ($scope.registeredCampIds.indexOf(camp.id) === -1) {
            $scope.registeredCampIds.push(camp.id);
            localStorage.setItem("nalam_registered_camps", angular.toJson($scope.registeredCampIds));
            camp.registered = true;
            alert("Successfully registered for " + camp.title + ". Confirmation SMS dispatched.");
        }
    };

    // 13. Dynamic Multi-language translations
    $scope.selectedLang = 'en';
    $scope.translations = {
        'en': {
            title: "Healthcare support closer to every village.",
            tagline: "Bridging the rural health gap",
            desc: "Accessible care for your family. Find the nearest doctors, 24/7 pharmacies, and upcoming medical camps in your local community."
        },
        'ta': {
            title: "ஒவ்வொரு கிராமத்திற்கும் அருகிலுள்ள சுகாதார ஆதரவு.",
            tagline: "கிராமப்புற சுகாதார இடைவெளியைக் குறைத்தல்",
            desc: "உங்கள் குடும்பத்திற்கு எளிதான சிகிச்சை. உங்கள் பகுதியில் உள்ள மருத்துவர்கள், 24/7 மருந்தகங்கள் மற்றும் மருத்துவ முகாம்களைக் கண்டறியவும்."
        }
    };
    $scope.toggleLanguage = function() {
        $scope.selectedLang = $scope.selectedLang === 'en' ? 'ta' : 'en';
    };

    // 14. Registration Form Logic
    $scope.credentials = {
        mobile: "",
        password: "",
        remember: false
    };
    
    $scope.feedbackMessage = "";

    $scope.submitRegistration = function() {
        if ($scope.registerForm && $scope.registerForm.$valid) {
            var newProfile = {
                name: $scope.patient.name,
                relationship: "Registered User",
                dob: $scope.patient.dob,
                gender: $scope.patient.gender,
                mobile: $scope.patient.mobile,
                village: $scope.patient.village,
                initials: $scope.patient.name.split(' ').map(function(n){return n[0];}).join('').toUpperCase().substring(0, 2),
                bgGradient: "from-purple-500 to-indigo-600",
                prescriptions: []
            };

            // Retrieve profiles list
            var currentProfiles = angular.fromJson(localStorage.getItem("nalam_profiles")) || [];
            currentProfiles.push(newProfile);
            localStorage.setItem("nalam_profiles", angular.toJson(currentProfiles));
            localStorage.setItem("nalam_active_index", currentProfiles.length - 1);

            $scope.feedbackMessage = "✔ Account created successfully! Redirecting to login...";
            $timeout(function() {
                window.location.href = "login.html";
            }, 1500);
        }
    };

    $scope.submitLogin = function() {
        if ($scope.loginForm && $scope.loginForm.$valid) {
            var storedProfiles = angular.fromJson(localStorage.getItem("nalam_profiles")) || [];
            var foundIndex = -1;
            
            for (var i = 0; i < storedProfiles.length; i++) {
                if (storedProfiles[i].mobile === $scope.credentials.mobile) {
                    foundIndex = i;
                    break;
                }
            }

            if (foundIndex !== -1) {
                localStorage.setItem("nalam_active_index", foundIndex);
                $scope.feedbackMessage = "✔ Login verification successful! Redirecting...";
                $timeout(function() {
                    window.location.href = "dashboard.html";
                }, 1200);
            } else {
                $scope.feedbackMessage = "✖ Phone number not recognized. Register first or use: 9876543210";
            }
        }
    };

    $scope.resetForm = function(formName) {
        $scope.credentials = { mobile: "", password: "", remember: false };
        if (formName === 'register') {
            $scope.patient = { name: "", dob: "", gender: "", mobile: "", village: "" };
        }
        if ($scope.registerForm) {
            $scope.registerForm.$setPristine();
            $scope.registerForm.$setUntouched();
        }
        if ($scope.loginForm) {
            $scope.loginForm.$setPristine();
            $scope.loginForm.$setUntouched();
        }
        $scope.feedbackMessage = "Form fields cleared.";
        $timeout(function() { $scope.feedbackMessage = ""; }, 2000);
    };

    $scope.forgotPassword = function() {
        $scope.feedbackMessage = "Reset password SMS code sent to " + ($scope.credentials.mobile || "registered phone") + ".";
        $timeout(function() { $scope.feedbackMessage = ""; }, 4000);
    };

}]);
=======
  app.controller('ProfileController', ['$scope', 'ApiFactory', 'AuthService', 'NotificationService', function ($scope, ApiFactory, AuthService, NotificationService) { $scope.user = angular.copy(AuthService.state.user); $scope.saved = false; $scope.save = function () { ApiFactory.updateProfile($scope.user).then(function (result) { AuthService.state.user = result.user; $scope.user = angular.copy(result.user); $scope.saved = true; NotificationService.show('Profile updated successfully.'); }, function (error) { NotificationService.show((error.data && error.data.message) || 'Profile update failed.', 'error'); }); }; }]);
})();
>>>>>>> Stashed changes
