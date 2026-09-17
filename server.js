const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nalam360';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'change-this-development-secret';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  mobile: { type: String, required: true, unique: true, match: /^\d{10}$/ },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'admin'], default: 'patient' },
  village: { type: String, required: true, trim: true },
  gender: { type: String, trim: true },
  dob: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  specialty: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true },
  fee: { type: Number, min: 0, default: 0 },
  experience: { type: Number, min: 0, default: 0 },
  available: { type: Boolean, default: true },
  initials: { type: String, default: 'DR' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  specialty: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const reminderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  slot: { type: String, required: true, trim: true },
  instruction: { type: String, trim: true },
  price: { type: Number, min: 0, default: 0 },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema, 'doctors');
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema, 'appointments');
const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema, 'reminders');

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${hashPassword(password, salt)}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function encodeToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function decodeToken(token) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  return payload.exp > Date.now() ? payload : null;
}

function publicUser(user) {
  return { id: user._id, name: user.name, mobile: user.mobile, role: user.role, village: user.village, gender: user.gender, dob: user.dob };
}

function auth(requiredRole) {
  return async (req, res, next) => {
    try {
      const payload = decodeToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
      if (!payload) return res.status(401).json({ message: 'Authentication required.' });
      const user = await User.findById(payload.id).lean();
      if (!user) return res.status(401).json({ message: 'User session is no longer valid.' });
      if (requiredRole && user.role !== requiredRole) return res.status(403).json({ message: 'You do not have permission for this action.' });
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid authentication token.' });
    }
  };
}

function handleError(res, error, fallback) {
  if (error && error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  if (error && error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the submitted fields.' });
  return res.status(500).json({ message: fallback });
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Nalam360 API' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, mobile, password, village, gender, dob } = req.body;
    if (!name || !mobile || !password || !village || password.length < 6) return res.status(400).json({ message: 'Name, mobile, village, and a 6-character password are required.' });
    const user = await User.create({ name, mobile, village, gender, dob, passwordHash: createPasswordHash(password), role: 'patient' });
    res.status(201).json({ user: publicUser(user), message: 'Registration successful.' });
  } catch (error) { handleError(res, error, 'Registration failed.'); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ mobile: req.body.mobile });
    if (!user || !verifyPassword(req.body.password || '', user.passwordHash)) return res.status(401).json({ message: 'Invalid mobile number or password.' });
    const token = encodeToken({ id: String(user._id), role: user.role, exp: Date.now() + (8 * 60 * 60 * 1000) });
    res.json({ token, user: publicUser(user), message: 'Login successful.' });
  } catch (error) { handleError(res, error, 'Login failed.'); }
});

app.get('/api/auth/me', auth(), (req, res) => res.json({ user: publicUser(req.user) }));

app.put('/api/auth/me', auth(), async (req, res) => {
  try {
    const updates = { name: req.body.name, village: req.body.village, gender: req.body.gender, dob: req.body.dob };
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).lean();
    res.json({ user: publicUser(user), message: 'Profile updated.' });
  } catch (error) { handleError(res, error, 'Profile update failed.'); }
});

app.get('/api/doctors', auth(), async (req, res) => {
  try { res.json(await Doctor.find().sort({ name: 1 }).lean()); } catch (error) { handleError(res, error, 'Failed to fetch doctors.'); }
});

app.get('/api/doctors/:id', auth(), async (req, res) => {
  try { const doctor = await Doctor.findById(req.params.id).lean(); if (!doctor) return res.status(404).json({ message: 'Doctor not found.' }); res.json(doctor); } catch (error) { res.status(400).json({ message: 'Invalid doctor id.' }); }
});

app.post('/api/doctors', auth('admin'), async (req, res) => {
  try { res.status(201).json(await Doctor.create(req.body)); } catch (error) { handleError(res, error, 'Doctor creation failed.'); }
});

app.put('/api/doctors/:id', auth('admin'), async (req, res) => {
  try { const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean(); if (!doctor) return res.status(404).json({ message: 'Doctor not found.' }); res.json(doctor); } catch (error) { res.status(400).json({ message: 'Doctor update failed.' }); }
});

app.delete('/api/doctors/:id', auth('admin'), async (req, res) => {
  try { const doctor = await Doctor.findByIdAndDelete(req.params.id); if (!doctor) return res.status(404).json({ message: 'Doctor not found.' }); res.json({ message: 'Doctor deleted.' }); } catch (error) { res.status(400).json({ message: 'Doctor deletion failed.' }); }
});

app.get('/api/appointments', auth(), async (req, res) => {
  try { const query = req.user.role === 'admin' ? {} : { patientId: req.user._id }; res.json(await Appointment.find(query).sort({ createdAt: -1 }).lean()); } catch (error) { handleError(res, error, 'Failed to fetch appointments.'); }
});

app.post('/api/appointments', auth(), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.body.doctorId).lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    const appointment = await Appointment.create({ ...req.body, patientId: req.user._id, patientName: req.user.name, doctorName: doctor.name, specialty: doctor.specialty, token: `NALAM-${crypto.randomInt(10000, 99999)}` });
    res.status(201).json(appointment);
  } catch (error) { handleError(res, error, 'Appointment creation failed.'); }
});

app.put('/api/appointments/:id', auth(), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, patientId: req.user._id };
    const appointment = await Appointment.findOneAndUpdate(query, req.body, { new: true, runValidators: true }).lean();
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    res.json(appointment);
  } catch (error) { res.status(400).json({ message: 'Appointment update failed.' }); }
});

app.delete('/api/appointments/:id', auth(), async (req, res) => {
  try { const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, patientId: req.user._id }; const appointment = await Appointment.findOneAndDelete(query); if (!appointment) return res.status(404).json({ message: 'Appointment not found.' }); res.json({ message: 'Appointment deleted.' }); } catch (error) { res.status(400).json({ message: 'Appointment deletion failed.' }); }
});

app.get('/api/reminders', auth(), async (req, res) => {
  try { const query = req.user.role === 'admin' ? {} : { patientId: req.user._id }; res.json(await Reminder.find(query).sort({ createdAt: -1 }).lean()); } catch (error) { handleError(res, error, 'Failed to fetch reminders.'); }
});

app.post('/api/reminders', auth(), async (req, res) => {
  try { res.status(201).json(await Reminder.create({ ...req.body, patientId: req.user._id })); } catch (error) { handleError(res, error, 'Reminder creation failed.'); }
});

app.put('/api/reminders/:id', auth(), async (req, res) => {
  try { const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, patientId: req.user._id }; const reminder = await Reminder.findOneAndUpdate(query, req.body, { new: true, runValidators: true }).lean(); if (!reminder) return res.status(404).json({ message: 'Reminder not found.' }); res.json(reminder); } catch (error) { res.status(400).json({ message: 'Reminder update failed.' }); }
});

app.delete('/api/reminders/:id', auth(), async (req, res) => {
  try { const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, patientId: req.user._id }; const reminder = await Reminder.findOneAndDelete(query); if (!reminder) return res.status(404).json({ message: 'Reminder not found.' }); res.json({ message: 'Reminder deleted.' }); } catch (error) { res.status(400).json({ message: 'Reminder deletion failed.' }); }
});

app.get('/api/admin/summary', auth('admin'), async (req, res) => {
  try { const [users, doctors, appointments, reminders] = await Promise.all([User.countDocuments(), Doctor.countDocuments(), Appointment.countDocuments(), Reminder.countDocuments()]); res.json({ users, doctors, appointments, reminders }); } catch (error) { handleError(res, error, 'Failed to fetch admin summary.'); }
});

app.use(express.static(path.join(__dirname)));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) return res.sendFile(path.join(__dirname, 'index.html'));
  next();
});
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    if (process.env.ADMIN_MOBILE && process.env.ADMIN_PASSWORD) {
      await User.updateOne(
        { mobile: process.env.ADMIN_MOBILE },
        { $setOnInsert: { name: process.env.ADMIN_NAME || 'Nalam Administrator', mobile: process.env.ADMIN_MOBILE, passwordHash: createPasswordHash(process.env.ADMIN_PASSWORD), role: 'admin', village: process.env.ADMIN_VILLAGE || 'Central Office' } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.log('MongoDB not connected. Server running in Phase 1 Frontend Mode.');
  }
  return app.listen(PORT, () => console.log(`Nalam360 running at http://localhost:${PORT}`));
}

if (require.main === module) {
  startServer().catch((error) => { console.error('Unable to start Nalam360:', error.message); process.exitCode = 1; });
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
module.exports.models = { User, Doctor, Appointment, Reminder };
