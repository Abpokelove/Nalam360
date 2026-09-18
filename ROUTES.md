# Nalam360 Client Route Contract

The active AngularJS client uses role-namespaced routes. Protected routes are enforced by the route guard in `js/app.js`; navigation visibility is only a usability aid.

| Route | Access | View | Controller |
| --- | --- | --- | --- |
| `/onboarding` | Public, first launch/reset | `views/onboarding/onboarding.html` | `MainController` |
| `/login` | Public after onboarding | `views/auth/login.html` | `AuthController` |
| `/register` | Public after onboarding | `views/auth/register.html` | `AuthController` |
| `/access-denied` | Public | `views/shared/access-denied.html` | None |
| `/patient/dashboard` | Patient only | `views/patient/dashboard.html` | `DashboardController` |
| `/patient/healthcare` | Patient only | `views/patient/healthcare.html` | `HealthcareController` |
| `/patient/doctors` | Patient only | `views/patient/doctors.html` | `HealthcareController` |
| `/patient/appointments` | Patient only | `views/patient/appointments.html` | `AppointmentController` |
| `/patient/reminders` | Patient only | `views/patient/reminders.html` | `ReminderController` |
| `/patient/camps` | Patient only | `views/patient/camps.html` | `CampController` |
| `/patient/awareness` | Patient only | `views/patient/awareness.html` | `AwarenessController` |
| `/patient/emergency` | Patient only | `views/patient/emergency.html` | `EmergencyController` |
| `/patient/profile` | Patient only | `views/patient/profile.html` | `ProfileController` |
| `/doctor/dashboard` | Doctor only | `views/doctor/dashboard.html` | `DoctorDashboardController` |
| `/doctor/patients` | Doctor only | `views/doctor/patients.html` | `DoctorPatientsController` |
| `/doctor/appointments` | Doctor only | `views/doctor/appointments.html` | `AppointmentController` |
| `/doctor/camps` | Doctor only | `views/doctor/camps.html` | `CampController` |
| `/doctor/awareness` | Doctor only | `views/doctor/awareness.html` | `AwarenessController` |
| `/doctor/emergency` | Doctor only | `views/doctor/emergency.html` | `EmergencyController` |
| `/doctor/profile` | Doctor only | `views/doctor/profile.html` | `ProfileController` |
| `/admin/dashboard` | Admin only | `views/admin/dashboard.html` | `AdminController` |
| `/admin/users` | Admin only | `views/admin/users.html` | `AdminController` |
| `/admin/doctors` | Admin only | `views/admin/doctors.html` | `AdminController` |
| `/admin/camps` | Admin only | `views/admin/camps.html` | `CampController` |
| `/admin/awareness` | Admin only | `views/admin/awareness.html` | `AwarenessController` |
| `/admin/emergency` | Admin only | `views/admin/emergency.html` | `EmergencyController` |
| `/admin/profile` | Admin only | `views/admin/profile.html` | `ProfileController` |

There are no `/dashboard`, `/doctor-dashboard`, `/admin`, or other generic aliases in the active route table. `ApiFactory`, `AuthService`, and `NotificationService` remain centralized shared services. No backend or database code is part of this client architecture phase.