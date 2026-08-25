// <!-- AngularJS Module -->
var app = angular.module("Nalam360App", ["ngAnimate"]);
var legacyApp = angular.module("nalam360", ["Nalam360App"]);

// <!-- AngularJS Service -->
app.factory("HealthcareService", function() {
    var data = {
        doctors: [
            { id: 1, name: "Dr. Anitha Raghavan", specialty: "General Physician", village: "Melur", exp: 12, fee: 250, available: true, initials: "AR", bgGradient: "from-teal-500 to-emerald-600" },
            { id: 2, name: "Dr. Rajesh Kumar", specialty: "Pediatrician", village: "Karur", exp: 8, fee: 300, available: false, initials: "RK", bgGradient: "from-blue-500 to-indigo-600" },
            { id: 3, name: "Dr. Karthik Raja", specialty: "Cardiologist", village: "Hosur", exp: 15, fee: 500, available: true, initials: "KR", bgGradient: "from-red-500 to-rose-600" },
            { id: 4, name: "Dr. Priyadarshini M.", specialty: "Gynaecologist", village: "Alanganallur", exp: 10, fee: 350, available: true, initials: "PM", bgGradient: "from-pink-500 to-purple-600" },
            { id: 5, name: "Dr. Syed Ibrahim", specialty: "Dermatologist", village: "Sivakasi", exp: 6, fee: 280, available: true, initials: "SI", bgGradient: "from-orange-500 to-amber-600" },
            { id: 6, name: "Dr. Ganesan A.", specialty: "Orthopaedic", village: "Pollachi", exp: 18, fee: 450, available: false, initials: "GA", bgGradient: "from-cyan-500 to-teal-600" }
        ],
        hospitals: [
            { name: "Civil Hospital Hosur", distance: 2.4, village: "Hosur", hours: "Open 24/7", phone: "04344-222012", rating: "4.5" },
            { name: "Nalam PHC Center Melur", distance: 0.8, village: "Melur", hours: "Closes 6 PM", phone: "94432-10876", rating: "4.2" },
            { name: "Community Care Unit Karur", distance: 4.1, village: "Karur", hours: "Open 24/7", phone: "98765-43210", rating: "4.0" },
            { name: "Sivakasi Mission Hospital", distance: 1.5, village: "Sivakasi", hours: "Open 24/7", phone: "04562-234567", rating: "4.7" }
        ],
        medicines: [
            { name: "Metformin 500mg", type: "Diabetes", slot: "Morning", instruction: "After Food", price: 45.00 },
            { name: "Atorvastatin 20mg", type: "Cholesterol", slot: "Night", instruction: "Bedtime", price: 82.50 },
            { name: "Paracetamol 650mg", type: "Fever", slot: "Afternoon", instruction: "As Needed (Post Lunch)", price: 15.00 },
            { name: "Amoxicillin 500mg", type: "Antibiotic", slot: "Morning", instruction: "Thrice Daily", price: 120.00 },
            { name: "Ibuprofen 400mg", type: "Pain Relief", slot: "Night", instruction: "After Food", price: 35.00 },
            { name: "Omeprazole 20mg", type: "Acidity", slot: "Morning", instruction: "Before Food", price: 50.00 }
        ],
        villages: ["Melur", "Karur", "Alanganallur", "Hosur", "Kovilpatti", "Sivakasi", "Pollachi", "Tenkasi", "Periyakulam"],
        emergencyContacts: [
            { name: "Ambulance Response", number: "108" },
            { name: "Nalam Toll-Free", number: "1800-360-360" },
            { name: "Hosur GH Emergency", number: "04344-222013" },
            { name: "Karur PHC Hotline", number: "94432-10878" },
            { name: "Poison Control Cell", number: "1800-222-1222" }
        ],
        healthTips: [
            "Staying hydrated is key for metabolic health. Aim for at least 8 glasses of water today.",
            "Walking for 30 minutes daily can significantly reduce blood pressure and cardiac risks.",
            "Wash hands thoroughly with soap before meals to prevent intestinal infections.",
            "Including green leafy vegetables increases iron levels and effectively fights anemia.",
            "Check your blood sugar levels regularly if you are on prescribed diabetic medication.",
            "Limit salt intake to under 5 grams daily to keep blood pressure in a healthy range.",
            "Protect your eyes from harsh sunlight. Take breaks if working on screens or fields.",
            "Ensure 7 to 8 hours of restful sleep every night to rebuild and repair muscle tissue."
        ],
        healthCamps: [
            { id: 1, title: "Free Eye Screening Camp", date: "Oct 24, 2024", location: "Community Center, Melur Village", org: "Nalam360 & VisionCare", slots: 12, type: "Eye Camp", initials: "EC", bgGradient: "from-teal-600 to-emerald-700" },
            { id: 2, title: "Village Wellness Day", date: "Oct 26, 2024", location: "Panchayat Office, Karur", org: "Govt. Health Mission", slots: 0, type: "Free Check-up", initials: "WC", bgGradient: "from-blue-600 to-indigo-700" },
            { id: 3, title: "Pediatric Wellness Camp", date: "Nov 05, 2024", location: "Sivakasi Union School", org: "Nalam360 Pediatrics", slots: 25, type: "Vaccination", initials: "PC", bgGradient: "from-purple-600 to-pink-700" }
        ]
    };
    return {
        getDoctors: function() { return data.doctors; },
        getHospitals: function() { return data.hospitals; },
        getMedicines: function() { return data.medicines; },
        getVillages: function() { return data.villages; },
        getEmergencyContacts: function() { return data.emergencyContacts; },
        getHealthTips: function() { return data.healthTips; },
        getHealthCamps: function() { return data.healthCamps; }
    };
});

// <!-- AngularJS Controller -->
app.controller("Nalam360Ctrl", ["$scope", "$controller", function($scope, $controller) {
    $controller("PatientController", { $scope: $scope });
}]);

// <!-- Dependency Injection -->
app.controller("PatientController", ["$scope", "HealthcareService", "$filter", "$timeout", "$interval", function($scope, HealthcareService, $filter, $timeout, $interval) {

    $scope.pageLinks = [
        { name: "Dashboard", url: "dashboard.html" },
        { name: "Find Healthcare", url: "healthcare.html" },
        { name: "Doctors", url: "healthcare.html#doctors-tab" },
        { name: "Health Camps", url: "HealthCamp.html" },
        { name: "Appointments", url: "ReferralsAndReminder.html" },
        { name: "Awareness", url: "HealthAwareness.html" },
        { name: "Emergency", url: "EmergencyAssistance.html" },
        { name: "Profile", url: "profile.html" },
        { name: "Support", url: "ProfileandSupport.html" }
    ];

    var updateCurrentPage = function() {
        var path = window.location.pathname.split('/').pop() || "index.html";
        $scope.currentPage = path + (window.location.hash || "");
    };

    updateCurrentPage();
    window.addEventListener("hashchange", updateCurrentPage);

    $scope.toggleSidebar = function() {
        $scope.mobileSidebarOpen = !$scope.mobileSidebarOpen;
    };

    $scope.downloadPrescription = function() {
        var prescriptionText = "Nalam360 Patient Prescription\n\n" +
            "Patient: " + ($scope.patient ? $scope.patient.name : "Unknown") + "\n" +
            "Village: " + ($scope.patient ? $scope.patient.village : "N/A") + "\n\n" +
            "Active medicines:\n" +
            (($scope.patient && $scope.patient.prescriptions && $scope.patient.prescriptions.length)
                ? $scope.patient.prescriptions.map(function(item) { return "- " + item.name + " - " + item.dosage; }).join("\n")
                : "No active prescriptions listed.");

        var blob = new Blob([prescriptionText], { type: "text/plain;charset=utf-8" });
        var fileUrl = URL.createObjectURL(blob);
        var downloadLink = document.createElement("a");
        downloadLink.href = fileUrl;
        downloadLink.download = "nalam360-prescription.txt";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(fileUrl);
    };

    // 1. Data Initialization & Multi-Profile Synchronization (via LocalStorage)
    var defaultProfiles = [
        {
            name: "Arun",
            relationship: "Self",
            dob: new Date("1998-06-15"),
            gender: "Male",
            mobile: "9876543210",
            village: "Hosur",
            initials: "A",
            bgGradient: "from-teal-500 to-emerald-600",
            prescriptions: [
                { name: "Metformin 500mg", dosage: "Twice daily" },
                { name: "Atorvastatin 20mg", dosage: "Bedtime" }
            ]
        },
        {
            name: "Meena P.",
            relationship: "Mother",
            dob: new Date("1964-08-15"),
            gender: "Female",
            mobile: "9876543211",
            village: "Hosur",
            initials: "MP",
            bgGradient: "from-blue-500 to-cyan-600",
            prescriptions: [
                { name: "Amlodipine 5mg", dosage: "Once daily (Morning)" }
            ]
        },
        {
            name: "Anita S.",
            relationship: "Sister",
            dob: new Date("1991-11-22"),
            gender: "Female",
            mobile: "9876543212",
            village: "Karur",
            initials: "AS",
            bgGradient: "from-purple-500 to-indigo-600",
            prescriptions: []
        }
    ];

    // Load or initialize profiles in localStorage (reset if old Meena data is found as Self profile)
    if (!localStorage.getItem("nalam_profiles") || localStorage.getItem("nalam_profiles").indexOf("Arun") === -1) {
        localStorage.setItem("nalam_profiles", angular.toJson(defaultProfiles));
        localStorage.setItem("nalam_active_index", "0");
    }
    
    // Load patient profiles
    $scope.profiles = angular.fromJson(localStorage.getItem("nalam_profiles"));
    
    // Active Profile index
    $scope.activeProfileIndex = parseInt(localStorage.getItem("nalam_active_index") || "0", 10);
    if ($scope.activeProfileIndex >= $scope.profiles.length) {
        $scope.activeProfileIndex = 0;
    }
    $scope.patient = $scope.profiles[$scope.activeProfileIndex];
    $scope.patient.dob = new Date($scope.patient.dob);

    // Persist profile changes globally
    $scope.saveProfile = function() {
        localStorage.setItem("nalam_profiles", angular.toJson($scope.profiles));
    };

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
    $scope.emergencyContacts = HealthcareService.getEmergencyContacts();
    $scope.healthCamps = HealthcareService.getHealthCamps();
    
    // Add registration state indicator to camps dynamically
    angular.forEach($scope.healthCamps, function(camp) {
        camp.registered = $scope.registeredCampIds.indexOf(camp.id) !== -1;
    });

    // 2. Profile Management
    $scope.switchProfile = function() {
        localStorage.setItem("nalam_active_index", $scope.activeProfileIndex);
        $scope.patient = $scope.profiles[$scope.activeProfileIndex];
        $scope.patient.dob = new Date($scope.patient.dob);
        $scope.generateNextTip(); // Refresh Tip relative to new profile
    };

    $scope.saveProfile = function() {
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
