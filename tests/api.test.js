const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('health endpoint responds ok', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('protected doctors endpoint rejects anonymous requests', async () => {
  const response = await request(app).get('/api/doctors');
  assert.equal(response.status, 401);
  assert.equal(
    response.body.message,
    'Authentication required.'
);
});

test('login succeeds in demo mode when MongoDB is unavailable', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ identity: 'patient@nalam360.test', password: 'patient123' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.role, 'patient');
});

test('unknown API routes return JSON 404 responses', async () => {
  const response = await request(app).get('/api/does-not-exist');
  assert.equal(response.status, 404);
  assert.equal(
    response.body.message,
    'Route not found.'
);
});

function getFutureAppointmentDate() {
  const date = new Date(Date.now() + (36 * 60 * 60 * 1000));
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function registerTestPatient() {
  const suffix = Date.now().toString().slice(-7);
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Patient',
      email: `test-${suffix}@example.test`,
      mobile: `9${suffix.padStart(9, '0')}`,
      password: 'testpass',
      village: 'Melur'
    });
  assert.equal(response.status, 201);
  return response.body.token;
}

async function login(identity, password) {
  const response = await request(app).post('/api/auth/login').send({ identity, password });
  assert.equal(response.status, 200);
  return response.body.token;
}

test('appointment booking rejects missing, invalid, past, and unavailable selections', async () => {
  const patientToken = await login('patient@nalam360.test', 'patient123');
  const url = '/api/appointments';
  const headers = { Authorization: `Bearer ${patientToken}` };

  const missing = await request(app).post(url).set(headers).send({});
  assert.equal(missing.status, 400);

  const invalid = await request(app).post(url).set(headers).send({
    doctorId: 'doc_1', date: 'not-a-date', time: '10:00 AM'
  });
  assert.equal(invalid.status, 400);

  const past = await request(app).post(url).set(headers).send({
    doctorId: 'doc_1', date: '2000-01-01', time: '10:00 AM'
  });
  assert.equal(past.status, 400);

  const unavailable = await request(app).post(url).set(headers).send({
    doctorId: 'doc_5', date: getFutureAppointmentDate(), time: '10:30 AM'
  });
  assert.equal(unavailable.status, 409);
});

test('patients cannot change another account appointment or mark their own visit completed', async () => {
  const otherPatientToken = await registerTestPatient();

  const foreignUpdate = await request(app)
    .put('/api/appointments/app_1')
    .set('Authorization', `Bearer ${otherPatientToken}`)
    .send({ status: 'cancelled' });
  assert.equal(foreignUpdate.status, 403);

  const patientToken = await login('patient@nalam360.test', 'patient123');
  const completionAttempt = await request(app)
    .put('/api/appointments/app_1')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({ status: 'completed' });
  assert.equal(completionAttempt.status, 403);
});

test('assigned doctor status changes are visible to the patient', async () => {
  const patientToken = await login('patient@nalam360.test', 'patient123');
  const booking = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({ doctorId: 'doc_1', date: getFutureAppointmentDate(), time: '10:30 AM' });
  assert.equal(booking.status, 201);

  const duplicate = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({ doctorId: 'doc_1', date: getFutureAppointmentDate(), time: '10:30 AM' });
  assert.equal(duplicate.status, 409);

  const doctorToken = await login('doctor@nalam360.test', 'doctor123');
  const updated = await request(app)
    .put(`/api/appointments/${booking.body.id}`)
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({ status: 'completed' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, 'completed');

  const patientAppointments = await request(app)
    .get('/api/appointments')
    .set('Authorization', `Bearer ${patientToken}`);
  const visibleAppointment = patientAppointments.body.find((item) => item.id === booking.body.id);
  assert.equal(visibleAppointment.status, 'completed');
});

test('patients cannot update another patient reminder and doctors cannot create reminders', async () => {
  const patientToken = await registerTestPatient();
  const foreignReminder = await request(app)
    .put('/api/reminders/rem_1')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({ completed: false });
  assert.equal(foreignReminder.status, 404);

  const doctorToken = await login('doctor@nalam360.test', 'doctor123');
  const doctorReminder = await request(app)
    .post('/api/reminders')
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({ name: 'Unauthorized record', slot: 'Morning' });
  assert.equal(doctorReminder.status, 403);
});

test('local healthcare listings do not fall back to unverified global fixtures', async () => {
  const patientToken = await login('patient@nalam360.test', 'patient123');
  const headers = { Authorization: `Bearer ${patientToken}` };
  const doctors = await request(app).get('/api/doctors').set(headers);
  const camps = await request(app).get('/api/camps').set(headers);
  const locations = await request(app).get('/api/locations');
  const facilities = await request(app).get('/api/facilities').set(headers);

  assert.equal(doctors.status, 200);
  assert.deepEqual(doctors.body, []);
  assert.equal(camps.status, 200);
  assert.deepEqual(camps.body, []);
  assert.equal(locations.status, 200);
  assert.deepEqual(locations.body, []);
  assert.equal(facilities.status, 200);
  assert.deepEqual(facilities.body, []);
});

test('prescription routes do not simulate writes when the database is unavailable', async () => {
  const doctorToken = await login('doctor@nalam360.test', 'doctor123');
  const response = await request(app)
    .post('/api/prescriptions')
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({ appointmentId: 'app_1', items: [{ medicine: 'Example', dosage: '1', frequency: 'Daily', duration: '1 day' }] });
  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
});

test('location and facility management is admin-only and facility discovery requires authentication', async () => {
  const patientToken = await login('patient@nalam360.test', 'patient123');
  const anonymousFacilities = await request(app).get('/api/facilities');
  assert.equal(anonymousFacilities.status, 401);

  const patientLocations = await request(app)
    .get('/api/admin/locations')
    .set('Authorization', `Bearer ${patientToken}`);
  assert.equal(patientLocations.status, 403);

  const patientCreate = await request(app)
    .post('/api/admin/locations')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({ name: 'Unverified Test District', level: 'district' });
  assert.equal(patientCreate.status, 403);
});

test('doctor work location is not editable through the personal profile endpoint', async () => {
  const doctorToken = await login('doctor@nalam360.test', 'doctor123');
  const response = await request(app)
    .put('/api/auth/me')
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({ village: 'Other place', villageId: '507f1f77bcf86cd799439011' });
  assert.equal(response.status, 403);
});

test('availability is not fabricated when persistent scheduling data is unavailable', async () => {
  const patientToken = await login('patient@nalam360.test', 'patient123');
  const response = await request(app)
    .get('/api/doctors/doc_1/availability?date=2030-01-01&villageId=507f1f77bcf86cd799439011')
    .set('Authorization', `Bearer ${patientToken}`);
  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
});
