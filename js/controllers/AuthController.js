(function () {
  'use strict';

  angular.module('Nalam360App').controller('AuthController', [
    '$scope',
    '$location',
    'ApiFactory',
    'AuthService',
    'NotificationService',
    function ($scope, $location, ApiFactory, AuthService, NotificationService) {

      $scope.selectedRole = 'patient'; // Default active role tab

      $scope.loginForm = {
        identity: '',
        password: ''
      };

      $scope.registerForm = {
        name: '',
        mobile: '',
        village: '',
        districtId: '',
        talukId: '',
        villageId: '',
        gender: 'Male',
        dob: '',
        password: ''
      };

      $scope.districts = [];
      $scope.taluks = [];
      $scope.villages = [];
      $scope.loading = false;
      $scope.errorMsg = null;

      ApiFactory.getLocations('district').then(function (locations) {
        $scope.districts = locations;
      }).catch(function () {
        $scope.errorMsg = 'Verified location records are not available. Please contact an administrator.';
      });

      $scope.selectDistrict = function () {
        $scope.registerForm.talukId = '';
        $scope.registerForm.villageId = '';
        $scope.registerForm.village = '';
        $scope.taluks = [];
        $scope.villages = [];
        if (!$scope.registerForm.districtId) return;
        ApiFactory.getLocations('taluk', $scope.registerForm.districtId).then(function (locations) {
          $scope.taluks = locations;
        });
      };

      $scope.selectTaluk = function () {
        $scope.registerForm.villageId = '';
        $scope.registerForm.village = '';
        $scope.villages = [];
        if (!$scope.registerForm.talukId) return;
        ApiFactory.getLocations('village', $scope.registerForm.talukId).then(function (locations) {
          $scope.villages = locations;
        });
      };

      $scope.selectVillage = function () {
        var village = $scope.villages.find(function (location) { return location.id === $scope.registerForm.villageId; });
        $scope.registerForm.village = village ? village.name : '';
      };

      // Role Tab Switcher (Patient, Doctor, Admin)
      var demoCredentials = {
        patient: { identity: '9876543210', password: 'patient123' },
        doctor: { identity: '9888888888', password: 'doctor123' },
        admin: { identity: '9999999999', password: 'admin123' }
      };

      $scope.selectRole = function (role) {
        $scope.selectedRole = role;
        $scope.errorMsg = null;
        if (demoCredentials[role]) {
          $scope.loginForm.identity = demoCredentials[role].identity;
          $scope.loginForm.password = demoCredentials[role].password;
        }
      };

      // 1-Click Shortcut Credentials Fillers
      $scope.fillDemoPatient = function () { $scope.selectRole('patient'); };
      $scope.fillDemoDoctor = function () { $scope.selectRole('doctor'); };
      $scope.fillDemoAdmin = function () { $scope.selectRole('admin'); };

      // Initialize default demo role
      $scope.selectRole('patient');

      // Real-Time Live Validation Indicators
      $scope.isIdentityValid = function () {
        var val = ($scope.loginForm.identity || '').trim();
        if (!val) return false;
        var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        var isMobile = /^\d{10}$/.test(val.replace(/\D/g, ''));
        return isEmail || isMobile;
      };

      $scope.isPasswordValid = function () {
        var pwd = $scope.loginForm.password || '';
        return pwd.length >= 4;
      };

      // Register Real-Time Live Validation Indicators
      $scope.isRegisterNameValid = function () {
        return ($scope.registerForm.name || '').trim().length >= 2;
      };

      $scope.isRegisterMobileValid = function () {
        return /^\d{10}$/.test(($scope.registerForm.mobile || '').replace(/\D/g, ''));
      };

      $scope.isRegisterVillageValid = function () {
        return !!$scope.registerForm.districtId && !!$scope.registerForm.talukId && !!$scope.registerForm.villageId;
      };

      $scope.isRegisterPasswordValid = function () {
        return ($scope.registerForm.password || '').length >= 4;
      };

      // Submit Login
      $scope.submitLogin = function () {
        $scope.errorMsg = null;

        if (!$scope.isIdentityValid()) {
          $scope.errorMsg = 'Please enter a valid email address or 10-digit mobile number.';
          return;
        }

        if (!$scope.isPasswordValid()) {
          $scope.errorMsg = 'Password must be at least 4 characters long.';
          return;
        }

        $scope.loading = true;

        AuthService.login({
          mobile: $scope.loginForm.identity,
          password: $scope.loginForm.password
        }).then(function (result) {
          $scope.loading = false;
          NotificationService.success('Welcome back, ' + result.user.name + '!');
          $location.path(AuthService.getDashboardRoute());
        }).catch(function (error) {
          $scope.loading = false;
          $scope.errorMsg = error.message || 'Invalid credentials. Please check your login details.';
          NotificationService.error($scope.errorMsg);
        });
      };

      // Submit Register
      $scope.submitRegister = function () {
        $scope.errorMsg = null;

        if (!$scope.isRegisterNameValid() || !$scope.isRegisterMobileValid() || !$scope.isRegisterPasswordValid() || !$scope.isRegisterVillageValid()) {
          $scope.errorMsg = 'Please fulfill all highlighted validation requirements.';
          return;
        }

        $scope.loading = true;

        AuthService.register($scope.registerForm).then(function (result) {
          $scope.loading = false;
          NotificationService.success('Account created successfully! Welcome to Nalam360.');
          $location.path('/login');
        }).catch(function (error) {
          $scope.loading = false;
          $scope.errorMsg = error.message || 'Registration failed.';
          NotificationService.error($scope.errorMsg);
        });
      };

    }
  ]);
})();
