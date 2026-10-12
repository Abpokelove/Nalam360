const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nalam360';
if (process.env.NODE_ENV === 'production' && !process.env.TOKEN_SECRET) {
  throw new Error('TOKEN_SECRET must be configured in production.');
}
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : false;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

/* =========================================================================
   1. MONGOOSE DATABASE SCHEMAS & MODELS
   ========================================================================= */

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, trim: true, lowercase: true, index: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient', required: true },
  village: { type: String, required: true, trim: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  talukId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null },
  gender: { type: String, trim: true, default: 'Male' },
  dob: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  specialty: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  talukId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null },
  experience: { type: Number, min: 0, default: 0 },
  fee: { type: Number, min: 0, default: 0 },
  available: { type: Boolean, default: true },
  initials: { type: String, default: 'DR' },
  nextSlot: { type: String, default: 'Available Today' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  specialty: { type: String, default: 'General Medicine' },
  village: { type: String, required: true },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'not_visited'], default: 'scheduled' },
  token: { type: String, required: true, unique: true },
  notes: { type: String, default: 'Routine Consultation' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Medication Reminder Schema
const reminderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  slot: { type: String, required: true, trim: true, enum: ['Morning', 'Afternoon', 'Night', 'All'] },
  instruction: { type: String, trim: true, default: 'Take after meals' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Health Camp Schema
const campSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  talukId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null },
  date: { type: String, required: true, trim: true },
  doctor: { type: String, required: true, trim: true },
  category: { type: String, trim: true, default: 'general' },
  specialty: { type: String, default: 'General Screening' },
  description: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true, default: '' },
  registeredCount: { type: Number, default: 0 },
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Health Awareness Article Schema
const awarenessSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  readTime: { type: String, default: '3 min read' },
  snippet: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Hierarchical Location Schema (district, taluk, village)
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  level: { type: String, required: true, enum: ['district', 'taluk', 'village'] },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  code: { type: String, trim: true, default: '' },
  active: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  source: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Healthcare Facility Schema (PHC, Sub-centre, CHC, Hospital)
const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  talukId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  address: { type: String, trim: true, default: '' },
  contact: { type: String, trim: true, default: '' },
  sourceUrl: { type: String, trim: true, default: '' },
  active: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Consultation-linked Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
  items: [{
    medicine: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true, default: '' }
  }],
  notes: { type: String, trim: true, default: '' },
  issuedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema, 'doctors');
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema, 'appointments');
const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema, 'reminders');
const Camp = mongoose.models.Camp || mongoose.model('Camp', campSchema, 'camps');
const Awareness = mongoose.models.Awareness || mongoose.model('Awareness', awarenessSchema, 'awareness');
const Location = mongoose.models.Location || mongoose.model('Location', locationSchema, 'locations');
const Facility = mongoose.models.Facility || mongoose.model('Facility', facilitySchema, 'facilities');
const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema, 'prescriptions');

/* =========================================================================
   2. AUTHENTICATION & SECURITY UTILITIES
   ========================================================================= */

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${hashPassword(password, salt)}`;
}

const fallbackUsers = [
  {
    _id: 'seed_patient',
    name: 'Muthuswamy S.',
    email: 'patient@nalam360.test',
    mobile: '9876543210',
    passwordHash: createPasswordHash('patient123'),
    role: 'patient',
    village: 'Melur',
    gender: 'Male',
    dob: '1982-06-15'
  },
  {
    _id: 'seed_doctor',
    name: 'Dr. Arumugam K.',
    email: 'doctor@nalam360.test',
    mobile: '9888888888',
    passwordHash: createPasswordHash('doctor123'),
    role: 'doctor',
    village: 'Melur',
    gender: 'Male'
  },
  {
    _id: 'seed_admin',
    name: 'Nalam Administrator',
    email: 'admin@nalam360.test',
    mobile: '9999999999',
    passwordHash: createPasswordHash('admin123'),
    role: 'admin',
    village: 'Central Office',
    gender: 'Female'
  }
];

const fallbackDoctors = [
  { _id: 'doc_1', name: 'Dr. Arumugam K.', email: 'doctor@nalam360.test', specialty: 'General Medicine', village: 'Melur', experience: 14, fee: 150, available: true, initials: 'AK', nextSlot: 'Today, 4:30 PM' },
  { _id: 'doc_2', name: 'Dr. Meenakshi S.', email: 'meenakshi@nalam360.test', specialty: 'Pediatrics', village: 'Karur', experience: 10, fee: 200, available: true, initials: 'MS', nextSlot: 'Tomorrow, 10:00 AM' },
  { _id: 'doc_3', name: 'Dr. Ramanathan V.', email: 'raman@nalam360.test', specialty: 'Cardiology', village: 'Hosur', experience: 18, fee: 350, available: true, initials: 'RV', nextSlot: 'Today, 6:00 PM' },
  { _id: 'doc_4', name: 'Dr. Kavitha P.', email: 'kavitha@nalam360.test', specialty: 'Gynecology', village: 'Sivakasi', experience: 12, fee: 250, available: true, initials: 'KP', nextSlot: 'Tomorrow, 11:30 AM' },
  { _id: 'doc_5', name: 'Dr. Murugan T.', email: 'murugan@nalam360.test', specialty: 'Ophthalmology', village: 'Pollachi', experience: 8, fee: 180, available: false, initials: 'MT', nextSlot: 'Friday, 2:00 PM' }
];

const fallbackPatients = [
  { id: 'pat_1', name: 'Muthuswamy S.', mobile: '9876543210', village: 'Melur', gender: 'Male', age: 44, primaryConcern: 'Hypertension Checkup', lastVisit: '2026-09-10' },
  { id: 'pat_2', name: 'Rajeshwari K.', mobile: '9812345678', village: 'Karur', gender: 'Female', age: 38, primaryConcern: 'Diabetes Followup', lastVisit: '2026-09-12' },
  { id: 'pat_3', name: 'Abdul B.', mobile: '9845678901', village: 'Pollachi', gender: 'Male', age: 52, primaryConcern: 'Eye Strain Screening', lastVisit: '2026-08-28' }
];

const fallbackAppointments = [
  { _id: 'app_1', patientId: 'seed_patient', patientName: 'Muthuswamy S.', doctorId: 'doc_1', doctorName: 'Dr. Arumugam K.', specialty: 'General Medicine', village: 'Melur', date: '2026-09-22', time: '10:30 AM', status: 'scheduled', token: 'NALAM-48291', notes: 'Routine blood pressure review' },
  { _id: 'app_2', patientId: 'seed_patient', patientName: 'Muthuswamy S.', doctorId: 'doc_1', doctorName: 'Dr. Arumugam K.', specialty: 'General Medicine', village: 'Melur', date: '2026-09-23', time: '04:00 PM', status: 'scheduled', token: 'NALAM-88123', notes: 'Follow-up consultation' }
];

const fallbackReminders = [
  { _id: 'rem_1', patientId: 'seed_patient', name: 'Metformin 500mg', slot: 'Morning', instruction: 'Take after breakfast', completed: true },
  { _id: 'rem_2', patientId: 'seed_patient', name: 'Amlodipine 5mg', slot: 'Morning', instruction: 'With water after breakfast', completed: true },
  { _id: 'rem_3', patientId: 'seed_patient', name: 'Multivitamin', slot: 'Afternoon', instruction: 'After lunch', completed: false }
];

const fallbackCamps = [
  { _id: 'camp_1', title: 'Free Village Eye Screening Camp', village: 'Melur', date: 'Oct 24, 2026', doctor: 'Dr. Murugan T.', specialty: 'Ophthalmology', description: 'Free vision checks and cataract screenings.', registeredCount: 42, registeredUsers: [] },
  { _id: 'camp_2', title: 'Community Diabetes & BP Screening', village: 'Karur', date: 'Oct 28, 2026', doctor: 'Dr. Arumugam K.', specialty: 'General Medicine', description: 'BP and sugar screening and counseling.', registeredCount: 68, registeredUsers: ['seed_patient'] },
  { _id: 'camp_3', title: 'Pediatric Wellness & Nutrition Camp', village: 'Sivakasi', date: 'Nov 05, 2026', doctor: 'Dr. Meenakshi S.', specialty: 'Pediatrics', description: 'Child growth and nutrition support.', registeredCount: 35, registeredUsers: [] }
];

const fallbackAwareness = [
  { _id: 'art_1', title: 'Hydration During Agricultural Field Work', category: 'General Health', readTime: '3 min read', snippet: 'Essential advice for farm workers to prevent heatstroke and dehydration.', content: 'Drink clean water at regular intervals...' },
  { _id: 'art_2', title: 'Managing Blood Pressure Naturally', category: 'Cardiology', readTime: '4 min read', snippet: 'Practical dietary adjustments and routines for rural lifestyles.', content: 'Reduce salt and walk daily...' }
];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function findFallbackUserByLogin(term) {
  const normalized = String(term || '').trim();
  const cleanMobile = normalized.replace(/\D/g, '');
  return fallbackUsers.find((user) => {
    const emailMatch = user.email && user.email.toLowerCase() === normalized.toLowerCase();
    const mobileMatch = user.mobile && String(user.mobile) === normalized;
    const cleanMatch = cleanMobile.length === 10 && String(user.mobile).replace(/\D/g, '') === cleanMobile;
    return emailMatch || mobileMatch || cleanMatch;
  }) || null;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
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
  return {
    id: String(user._id),
    name: user.name,
    email: user.email || '',
    mobile: user.mobile,
    role: user.role,
    village: user.village,
    districtId: user.districtId ? String(user.districtId) : null,
    talukId: user.talukId ? String(user.talukId) : null,
    villageId: user.villageId ? String(user.villageId) : null,
    facilityId: user.facilityId ? String(user.facilityId) : null,
    gender: user.gender || 'Male',
    dob: user.dob || ''
  };
}

function hasValidAppointmentDate(date, time, timeZone = process.env.APP_TIME_ZONE || 'Asia/Kolkata') {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (!['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'].includes(time)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const [hourText, minuteText] = time.slice(0, -3).split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) return false;
  if (hour < 1 || hour > 12 || minute > 59) return false;

  const hour24 = (hour % 12) + (time.endsWith('PM') ? 12 : 0);
  const nowParts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date()).reduce((parts, part) => {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
    return parts;
  }, {});
  const requested = [year, month, day, hour24, minute];
  const current = [nowParts.year, nowParts.month, nowParts.day, nowParts.hour, nowParts.minute];
  for (let index = 0; index < requested.length; index += 1) {
    if (requested[index] !== current[index]) return requested[index] > current[index];
  }
  return false;
}

async function isAssignedDoctor(appointment, user) {
  if (!user || user.role !== 'doctor') return false;
  if (appointment.doctorId) {
    if (isMongoConnected()) {
      const doctor = await Doctor.findOne({ email: user.email }).select('_id').lean();
      return !!doctor && String(appointment.doctorId) === String(doctor._id);
    }
    const doctor = fallbackDoctors.find((entry) => entry.email === user.email);
    if (doctor && String(appointment.doctorId) === String(doctor._id)) return true;
  }
  return String(appointment.doctorName || '').trim().toLowerCase() === String(user.name || '').trim().toLowerCase();
}

async function getDoctorProfileForUser(user) {
  if (!user || user.role !== 'doctor') return null;
  if (isMongoConnected()) return Doctor.findOne({ email: user.email }).lean();
  return fallbackDoctors.find((doctor) => doctor.email === user.email) || null;
}

function canPatientManageAppointment(appointment, user) {
  return user && user.role === 'patient' && String(appointment.patientId) === String(user._id);
}

function validAppointmentStatus(status) {
  return ['scheduled', 'completed', 'cancelled', 'not_visited'].includes(status);
}

// Role-Based Express Authorization Middleware
function auth(requiredRoles) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.replace(/^Bearer\s+/i, '');
      const payload = decodeToken(token);

      if (!payload) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      let user = null;
      if (isMongoConnected()) {
        user = await User.findById(payload.id).lean();
      } else {
        user = fallbackUsers.find((entry) => String(entry._id) === String(payload.id)) || null;
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Active user session invalid.' });
      }

      if (requiredRoles) {
        const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        if (!allowed.includes(user.role)) {
          return res.status(403).json({ success: false, message: 'Access denied. Unauthorized role permissions.' });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Authentication verification failed.' });
    }
  };
}

function handleError(res, error, fallbackMsg) {
  console.error('API Error:', error && error.message);
  if (error && error.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with that email or mobile number already exists.' });
  }
  if (error && error.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Invalid input fields. Please check submitted data.' });
  }
  return res.status(500).json({ success: false, message: fallbackMsg || 'Internal server error.' });
}

async function getLocationChain(villageId, verifiedOnly = false) {
  if (!mongoose.Types.ObjectId.isValid(villageId)) return null;
  const village = await Location.findOne({ _id: villageId, level: 'village', active: true }).lean();
  if (!village || !village.parentId) return null;
  const taluk = await Location.findOne({ _id: village.parentId, level: 'taluk', active: true }).lean();
  if (!taluk || !taluk.parentId) return null;
  const district = await Location.findOne({ _id: taluk.parentId, level: 'district', active: true }).lean();
  if (!district) return null;
  if (verifiedOnly && (!village.verified || !taluk.verified || !district.verified)) return null;
  return { district, taluk, village };
}

function hasSourceUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (error) {
    return false;
  }
}

function sendWriteError(res, error, message) {
  if (error && error.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with this name already exists at that location.' });
  }
  return handleError(res, error, message);
}

/* =========================================================================
   3. EXPRESS REST API ENDPOINTS
   ========================================================================= */

// Public catalogs only expose active, source-verified geography and facilities.
app.get('/api/locations', async (req, res) => {
  try {
    if (!isMongoConnected()) return res.json([]);
    const { level, parentId } = req.query;
    if (level && !['district', 'taluk', 'village'].includes(level)) {
      return res.status(400).json({ success: false, message: 'Invalid location level.' });
    }
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ success: false, message: 'Invalid parent location ID.' });
    }
    const query = { active: true, verified: true };
    if (level) query.level = level;
    if (parentId) query.parentId = parentId;
    const locations = await Location.find(query).sort({ name: 1 }).lean();
    const eligible = [];
    for (const location of locations) {
      if (location.level === 'district') {
        eligible.push(location);
      } else if (location.level === 'taluk' && location.parentId) {
        const district = await Location.findOne({ _id: location.parentId, level: 'district', active: true, verified: true }).select('_id').lean();
        if (district) eligible.push(location);
      } else if (location.level === 'village' && await getLocationChain(location._id, true)) {
        eligible.push(location);
      }
    }
    res.json(eligible.map((location) => ({ ...location, id: String(location._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch verified locations.');
  }
});

app.get('/api/facilities', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.json([]);
    const query = { active: true, verified: true };
    for (const key of ['districtId', 'talukId', 'villageId', 'type']) {
      if (req.query[key]) query[key] = req.query[key];
    }
    if (query.villageId && !mongoose.Types.ObjectId.isValid(query.villageId)) {
      return res.status(400).json({ success: false, message: 'Invalid village ID.' });
    }
    let referenceVillageId = null;
    if (req.user.role === 'patient') {
      referenceVillageId = req.user.villageId;
    } else if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfileForUser(req.user);
      referenceVillageId = doctor && doctor.villageId;
    }
    if (referenceVillageId) {
      const currentChain = await getLocationChain(referenceVillageId, true);
      const requestedChain = await getLocationChain(query.villageId || referenceVillageId, true);
      if (!currentChain || !requestedChain || String(currentChain.taluk._id) !== String(requestedChain.taluk._id)) {
        return res.status(403).json({ success: false, message: 'Facility search is limited to your verified taluk.' });
      }
      query.villageId = query.villageId || referenceVillageId;
    }
    const facilities = await Facility.find(query).sort({ name: 1 }).lean();
    const result = [];
    for (const facility of facilities) {
      const chain = await getLocationChain(facility.villageId, true);
      if (chain) result.push({
        ...facility,
        id: String(facility._id),
        districtName: chain.district.name,
        talukName: chain.taluk.name,
        villageName: chain.village.name,
        locationMatch: referenceVillageId ? (String(chain.village._id) === String(referenceVillageId) ? 'exact' : 'broader') : 'exact'
      });
    }
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Failed to fetch verified healthcare facilities.');
  }
});

app.get('/api/admin/facilities', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.json([]);
    const facilities = await Facility.find({ active: true }).sort({ name: 1 }).lean();
    res.json(facilities.map((facility) => ({ ...facility, id: String(facility._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch facility records.');
  }
});

app.get('/api/admin/locations', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.json([]);
    const locations = await Location.find({ active: true }).sort({ level: 1, name: 1 }).lean();
    res.json(locations.map((location) => ({ ...location, id: String(location._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch location records.');
  }
});

app.post('/api/admin/locations', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Location management requires the database connection.' });
    const { name, level, parentId, sourceUrl = '', verified = false } = req.body;
    if (typeof name !== 'string' || !name.trim() || !['district', 'taluk', 'village'].includes(level)) {
      return res.status(400).json({ success: false, message: 'A name and valid district, taluk, or village level are required.' });
    }
    let parent = null;
    if (level === 'district' && parentId) return res.status(400).json({ success: false, message: 'Districts cannot have a parent location.' });
    if (level !== 'district') {
      const parentLevel = level === 'taluk' ? 'district' : 'taluk';
      if (!mongoose.Types.ObjectId.isValid(parentId)) return res.status(400).json({ success: false, message: `${level} requires a valid ${parentLevel} parent.` });
      parent = await Location.findOne({ _id: parentId, level: parentLevel, active: true });
      if (!parent) return res.status(400).json({ success: false, message: `The selected parent is not an active ${parentLevel}.` });
    }
    if (verified && (!hasSourceUrl(sourceUrl) || (parent && !parent.verified))) {
      return res.status(400).json({ success: false, message: 'Verified locations require an HTTP(S) source URL and a verified parent chain.' });
    }
    const location = await Location.create({
      name: name.trim(), normalizedName: name.trim().toLocaleLowerCase('en'), level,
      parentId: parent ? parent._id : null, sourceUrl, verified: verified === true
    });
    res.status(201).json({ ...location.toObject(), id: String(location._id) });
  } catch (error) {
    sendWriteError(res, error, 'Failed to create location.');
  }
});

app.put('/api/admin/locations/:id', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Location management requires the database connection.' });
    const location = await Location.findOne({ _id: req.params.id, active: true });
    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });
    const { name, parentId, sourceUrl = '', verified = false } = req.body;
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ success: false, message: 'A location name is required.' });

    let parent = null;
    if (location.level === 'district') {
      if (parentId) return res.status(400).json({ success: false, message: 'Districts cannot have a parent location.' });
    } else {
      const parentLevel = location.level === 'taluk' ? 'district' : 'taluk';
      if (!mongoose.Types.ObjectId.isValid(parentId)) return res.status(400).json({ success: false, message: `${location.level} requires a valid ${parentLevel} parent.` });
      parent = await Location.findOne({ _id: parentId, level: parentLevel, active: true });
      if (!parent) return res.status(400).json({ success: false, message: `The selected parent is not an active ${parentLevel}.` });
    }
    if (verified && (!hasSourceUrl(sourceUrl) || (parent && !parent.verified))) {
      return res.status(400).json({ success: false, message: 'Verified locations require an HTTP(S) source URL and a verified parent chain.' });
    }
    location.name = name.trim();
    location.normalizedName = name.trim().toLocaleLowerCase('en');
    location.parentId = parent ? parent._id : null;
    location.sourceUrl = sourceUrl;
    location.verified = verified === true;
    await location.save();
    res.json({ ...location.toObject(), id: String(location._id) });
  } catch (error) {
    sendWriteError(res, error, 'Failed to update location.');
  }
});

app.post('/api/admin/facilities', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Facility management requires the database connection.' });
    const { name, type, districtId, talukId, villageId, address = '', contact = '', sourceUrl = '', verified = false } = req.body;
    if (!name || !['phc', 'clinic', 'hospital', 'other'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Facility name and a valid facility type are required.' });
    }
    const chain = await getLocationChain(villageId);
    if (!chain || String(chain.taluk._id) !== String(talukId) || String(chain.district._id) !== String(districtId)) {
      return res.status(400).json({ success: false, message: 'Facility district, taluk, and village must form one valid hierarchy.' });
    }
    if (verified && (!hasSourceUrl(sourceUrl) || !chain.district.verified || !chain.taluk.verified || !chain.village.verified)) {
      return res.status(400).json({ success: false, message: 'Verified facilities require a source URL and a fully verified location hierarchy.' });
    }
    const facility = await Facility.create({ name: name.trim(), type, districtId, talukId, villageId, address, contact, sourceUrl, verified: verified === true });
    res.status(201).json({ ...facility.toObject(), id: String(facility._id) });
  } catch (error) {
    sendWriteError(res, error, 'Failed to create healthcare facility.');
  }
});

app.put('/api/admin/facilities/:id', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Facility management requires the database connection.' });
    const facility = await Facility.findOne({ _id: req.params.id, active: true });
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found.' });
    const { name, type, districtId, talukId, villageId, address = '', contact = '', sourceUrl = '', verified = false } = req.body;
    if (!name || !['phc', 'clinic', 'hospital', 'other'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Facility name and a valid facility type are required.' });
    }
    const chain = await getLocationChain(villageId);
    if (!chain || String(chain.taluk._id) !== String(talukId) || String(chain.district._id) !== String(districtId)) {
      return res.status(400).json({ success: false, message: 'Facility district, taluk, and village must form one valid hierarchy.' });
    }
    if (verified && (!hasSourceUrl(sourceUrl) || !chain.district.verified || !chain.taluk.verified || !chain.village.verified)) {
      return res.status(400).json({ success: false, message: 'Verified facilities require a source URL and a fully verified location hierarchy.' });
    }
    Object.assign(facility, { name: name.trim(), type, districtId, talukId, villageId, address, contact, sourceUrl, verified: verified === true });
    await facility.save();
    res.json({ ...facility.toObject(), id: String(facility._id) });
  } catch (error) {
    sendWriteError(res, error, 'Failed to update healthcare facility.');
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', service: 'Nalam360 Express API', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, mobile, password, village, districtId, talukId, villageId, gender, dob } = req.body;
    if (!name || !mobile || !password || !village) {
      return res.status(400).json({ success: false, message: 'Full name, 10-digit mobile, village sector, and password are required.' });
    }
    if (isMongoConnected() && (!districtId || !talukId || !villageId)) {
      return res.status(400).json({ success: false, message: 'Select a verified district, taluk, and village.' });
    }
    if (districtId || talukId || villageId) {
      if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Structured location verification requires the database connection.' });
      const chain = await getLocationChain(villageId, true);
      if (!chain || String(chain.district._id) !== String(districtId) || String(chain.taluk._id) !== String(talukId)) {
        return res.status(400).json({ success: false, message: 'Select a verified district, taluk, and village hierarchy.' });
      }
    }
    const cleanMobile = String(mobile).replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.create({
        name: name.trim(),
        email: (email || '').trim().toLowerCase(),
        mobile: cleanMobile,
        village: village.trim(),
        districtId: districtId || null,
        talukId: talukId || null,
        villageId: villageId || null,
        gender: gender || 'Male',
        dob: dob || '',
        passwordHash: createPasswordHash(password),
        role: 'patient'
      });
    } else {
      const createdUser = {
        _id: `demo_patient_${Date.now()}`,
        name: name.trim(),
        email: (email || '').trim().toLowerCase(),
        mobile: cleanMobile,
        village: village.trim(),
        districtId: districtId || null,
        talukId: talukId || null,
        villageId: villageId || null,
        gender: gender || 'Male',
        dob: dob || '',
        passwordHash: createPasswordHash(password),
        role: 'patient'
      };
      fallbackUsers.push(createdUser);
      user = createdUser;
    }

    const token = encodeToken({ id: String(user._id), role: user.role, exp: Date.now() + (24 * 60 * 60 * 1000) });
    res.status(201).json({ success: true, token, user: publicUser(user), message: 'Patient account registered successfully.' });
  } catch (error) {
    handleError(res, error, 'Registration failed.');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identity, email, mobile, password } = req.body;
    const term = (identity || email || mobile || '').trim();
    if (!term || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email/mobile and password.' });
    }

    let user = null;
    if (mongoose.connection.readyState === 1) {
      const cleanMobile = term.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { email: term.toLowerCase() },
          { mobile: term },
          { mobile: cleanMobile.length === 10 ? cleanMobile : '-1' }
        ]
      });
    } else {
      user = findFallbackUserByLogin(term);
    }

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number, email, or password.' });
    }

    const token = encodeToken({ id: String(user._id), role: user.role, exp: Date.now() + (24 * 60 * 60 * 1000) });
    res.json({ success: true, token, user: publicUser(user), message: 'Authentication successful.' });
  } catch (error) {
    handleError(res, error, 'Login failed.');
  }
});

app.get('/api/auth/me', auth(), (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

app.put('/api/auth/me', auth(), async (req, res) => {
  try {
    const { name, village, districtId, talukId, villageId, gender, dob } = req.body;
    if (req.user.role === 'doctor' && (districtId || talukId || villageId)) {
      return res.status(403).json({ success: false, message: 'Doctor work locations must be changed by an administrator.' });
    }
    if (districtId || talukId || villageId) {
      if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Structured location verification requires the database connection.' });
      const chain = await getLocationChain(villageId, true);
      if (!chain || String(chain.district._id) !== String(districtId) || String(chain.taluk._id) !== String(talukId)) {
        return res.status(400).json({ success: false, message: 'Select a verified district, taluk, and village hierarchy.' });
      }
    }
    if (!isMongoConnected()) {
      const target = fallbackUsers.find((user) => String(user._id) === String(req.user._id));
      if (!target) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      target.name = name || target.name;
      target.village = village || target.village;
      target.districtId = districtId || target.districtId;
      target.talukId = talukId || target.talukId;
      target.villageId = villageId || target.villageId;
      target.gender = gender || target.gender;
      target.dob = dob || target.dob;
      return res.json({ success: true, user: publicUser(target), message: 'Profile details updated.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, village, districtId, talukId, villageId, gender, dob },
      { new: true, runValidators: true }
    ).lean();
    res.json({ success: true, user: publicUser(user), message: 'Profile details updated.' });
  } catch (error) {
    handleError(res, error, 'Profile update failed.');
  }
});

app.post('/api/auth/logout', auth(), (req, res) => {
  res.json({ success: true, message: 'Signed out successfully.' });
});

// Doctor Routes
app.get('/api/doctors', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      if (req.user.role !== 'admin') return res.json([]);
      return res.json(fallbackDoctors.map(d => ({ ...d, id: String(d._id) })));
    }

    const { specialty, villageId, search, facilityId } = req.query;
    const filter = {};
    if (specialty) filter.specialty = specialty;
    if (facilityId) {
      if (!mongoose.Types.ObjectId.isValid(facilityId)) return res.status(400).json({ success: false, message: 'Invalid facility ID.' });
      filter.facilityId = facilityId;
    }
    if (req.query.available !== undefined) {
      if (!['true', 'false'].includes(req.query.available)) return res.status(400).json({ success: false, message: 'Availability filter must be true or false.' });
      filter.available = req.query.available === 'true';
    }
    if (req.user.role === 'patient') {
      const selectedVillageId = villageId || req.user.villageId;
      const patientChain = await getLocationChain(req.user.villageId, true);
      const selectedChain = await getLocationChain(selectedVillageId, true);
      if (!patientChain || !selectedChain) return res.json([]);
      if (String(patientChain.taluk._id) !== String(selectedChain.taluk._id)) {
        return res.status(403).json({ success: false, message: 'Doctor search is limited to your verified taluk.' });
      }
      filter.villageId = selectedVillageId;
    } else if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfileForUser(req.user);
      if (!doctor || !await getLocationChain(doctor.villageId, true)) return res.json([]);
      filter.villageId = doctor.villageId;
    } else if (villageId) {
      if (!await getLocationChain(villageId, true)) return res.status(400).json({ success: false, message: 'Choose an active verified village.' });
      filter.villageId = villageId;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } }
      ];
    }
    const doctors = await Doctor.find(filter).sort({ name: 1 }).lean();
    const result = [];
    for (const doctor of doctors) {
      const chain = await getLocationChain(doctor.villageId, true);
      const facility = doctor.facilityId ? await Facility.findOne({ _id: doctor.facilityId, active: true }).lean() : null;
      if (req.user.role !== 'admin' && (!chain || !facility || !facility.verified)) continue;
      if (!chain && req.user.role !== 'admin') continue;
      result.push({
        ...doctor,
        id: String(doctor._id),
        districtId: doctor.districtId ? String(doctor.districtId) : null,
        talukId: doctor.talukId ? String(doctor.talukId) : null,
        villageId: doctor.villageId ? String(doctor.villageId) : null,
        facilityId: facility ? String(facility._id) : null,
        facilityName: facility && facility.verified ? facility.name : 'Unverified facility',
        districtName: chain ? chain.district.name : '',
        talukName: chain ? chain.taluk.name : '',
        villageName: chain ? chain.village.name : doctor.village,
        locationMatch: !chain || !facility || !facility.verified ? 'unverified' : String(chain.village._id) === String(req.user.villageId) ? 'exact' : 'broader'
      });
    }
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Failed to fetch doctor directory.');
  }
});

app.get('/api/doctors/:id/availability', auth('patient'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Appointment availability requires the database connection.' });
    const { date, villageId = req.user.villageId } = req.query;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'A valid appointment date is required.' });
    }
    const doctor = await Doctor.findById(req.params.id).lean();
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    if (!doctor.available) return res.json({ date, villageId, timeSlots: [] });
    const patientChain = await getLocationChain(req.user.villageId, true);
    const selectedChain = await getLocationChain(villageId, true);
    if (!patientChain || !selectedChain || String(patientChain.taluk._id) !== String(selectedChain.taluk._id)) {
      return res.status(403).json({ success: false, message: 'Availability search is limited to your verified taluk.' });
    }
    if (String(doctor.villageId) !== String(selectedChain.village._id) || !await getLocationChain(doctor.villageId, true)) {
      return res.status(404).json({ success: false, message: 'Doctor does not serve the selected verified village.' });
    }
    const booked = await Appointment.find({ doctorId: doctor._id, date, status: 'scheduled' }).select('time').lean();
    const bookedTimes = new Set(booked.map((appointment) => appointment.time));
    const allSlots = ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'];
    const timeSlots = allSlots.filter((slot) => !bookedTimes.has(slot) && hasValidAppointmentDate(date, slot));
    res.json({ date, villageId: String(selectedChain.village._id), locationMatch: String(selectedChain.village._id) === String(req.user.villageId) ? 'exact' : 'broader', timeSlots });
  } catch (error) {
    handleError(res, error, 'Failed to fetch appointment availability.');
  }
});

app.get('/api/doctors/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      if (req.user.role !== 'admin') return res.status(404).json({ success: false, message: 'No verified local doctor record is available.' });
      const doctor = fallbackDoctors.find(d => String(d._id) === String(req.params.id));
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      return res.json({ ...doctor, id: String(doctor._id) });
    }

    const doctor = await Doctor.findById(req.params.id).lean();
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    if (req.user.role === 'patient' && (!req.user.villageId || String(doctor.villageId) !== String(req.user.villageId))) {
      return res.status(404).json({ success: false, message: 'Doctor not found in your verified village.' });
    }
    res.json({ ...doctor, id: String(doctor._id) });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid doctor ID.' });
  }
});

app.post('/api/doctors', auth('admin'), async (req, res) => {
  try {
    const { name, email, mobile, password, specialty, village, districtId, talukId, villageId, facilityId, experience, fee, available } = req.body;

    if (!name || !specialty || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Doctor name, specialty, email, mobile, and an initial password are required.' });
    }
    if (String(password).length < 12) return res.status(400).json({ success: false, message: 'Initial doctor password must be at least 12 characters.' });

    const cleanMobile = String(mobile).replace(/\D/g, '');
    if (cleanMobile.length !== 10) return res.status(400).json({ success: false, message: 'Doctor mobile number must contain exactly 10 digits.' });
    const docEmail = email.trim().toLowerCase();
    const docPassword = password;

    if (!isMongoConnected()) {
      if (!village) return res.status(400).json({ success: false, message: 'Doctor village is required.' });
      const initials = (name || 'DR').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const createdDoctor = {
        _id: `doc_${Date.now()}`,
        name: name.trim(),
        email: docEmail,
        specialty: specialty.trim(),
        village: village.trim(),
        experience: Number(experience || 0),
        fee: Number(fee || 0),
        available: available !== false,
        initials,
        nextSlot: 'Available Today'
      };

      const existingUser = fallbackUsers.find((user) => user.role === 'doctor' && (user.email === docEmail || user.mobile === cleanMobile));
      if (!existingUser) {
        fallbackUsers.push({
          _id: `seed_doctor_${Date.now()}`,
          name: name.trim(),
          email: docEmail,
          mobile: cleanMobile,
          passwordHash: createPasswordHash(docPassword),
          role: 'doctor',
          village: village.trim(),
          gender: 'Male'
        });
      }

      fallbackDoctors.unshift(createdDoctor);
      return res.status(201).json({ ...createdDoctor, id: String(createdDoctor._id), mobile: cleanMobile, email: docEmail });
    }

    const chain = await getLocationChain(villageId, true);
    if (!chain || String(chain.district._id) !== String(districtId) || String(chain.taluk._id) !== String(talukId)) {
      return res.status(400).json({ success: false, message: 'Doctor district, taluk, and village must form one verified hierarchy.' });
    }
    const facility = await Facility.findOne({ _id: facilityId, villageId, active: true, verified: true });
    if (!facility) return res.status(400).json({ success: false, message: 'Select a verified healthcare facility in the doctor village.' });

    // 1. Create Doctor Profile Entry
    const initials = (name || 'DR').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const doc = await Doctor.create({
      name: name.trim(),
      email: docEmail,
      specialty: specialty.trim(),
      village: chain.village.name,
      districtId: chain.district._id,
      talukId: chain.taluk._id,
      villageId: chain.village._id,
      facilityId: facility._id,
      experience: Number(experience || 0),
      fee: Number(fee || 0),
      available: available !== false,
      initials,
      nextSlot: 'Available Today'
    });

    // 2. Create Doctor User Login Account (role: 'doctor')
    const existingUser = await User.findOne({ $or: [{ email: docEmail }, { mobile: cleanMobile }] });
    if (!existingUser) {
      await User.create({
        name: name.trim(),
        email: docEmail,
        mobile: cleanMobile,
        passwordHash: createPasswordHash(docPassword),
        role: 'doctor',
        village: chain.village.name,
        districtId: chain.district._id,
        talukId: chain.taluk._id,
        villageId: chain.village._id,
        facilityId: facility._id,
        gender: 'Male'
      });
    }

    res.status(201).json({ ...doc.toObject(), id: String(doc._id), mobile: cleanMobile, email: docEmail });
  } catch (error) {
    handleError(res, error, 'Failed to create doctor profile and login account.');
  }
});

app.put('/api/doctors/:id', auth('admin'), async (req, res) => {
  try {
    const { password, ...doctorData } = req.body;
    if (password && password.length < 12) return res.status(400).json({ success: false, message: 'Doctor password must be at least 12 characters.' });

    if (!isMongoConnected()) {
      const doc = fallbackDoctors.find((entry) => String(entry._id) === String(req.params.id));
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      Object.assign(doc, doctorData);
      if (password && password.length >= 12 && doc.email) {
        const user = fallbackUsers.find((entry) => entry.role === 'doctor' && entry.email === doc.email);
        if (user) {
          user.passwordHash = createPasswordHash(password);
        }
      }
      return res.json({ ...doc, id: String(doc._id) });
    }

    if (doctorData.villageId || doctorData.districtId || doctorData.talukId || doctorData.facilityId) {
      const chain = await getLocationChain(doctorData.villageId, true);
      const facility = await Facility.findOne({ _id: doctorData.facilityId, villageId: doctorData.villageId, active: true, verified: true });
      if (!chain || String(chain.district._id) !== String(doctorData.districtId) || String(chain.taluk._id) !== String(doctorData.talukId) || !facility) {
        return res.status(400).json({ success: false, message: 'Doctor location and verified facility must belong to one hierarchy.' });
      }
      doctorData.village = chain.village.name;
    }
    const doc = await Doctor.findByIdAndUpdate(req.params.id, doctorData, { new: true, runValidators: true }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    await User.updateOne({ email: doc.email, role: 'doctor' }, {
      $set: {
        name: doc.name,
        village: doc.village,
        districtId: doc.districtId,
        talukId: doc.talukId,
        villageId: doc.villageId,
        facilityId: doc.facilityId
      }
    });

    // Update associated User account password if provided
    if (password && password.length >= 12 && doc.email) {
      const user = await User.findOne({ email: doc.email, role: 'doctor' });
      if (user) {
        user.passwordHash = createPasswordHash(password);
        await user.save();
      }
    }

    res.json({ ...doc, id: String(doc._id) });
  } catch (error) {
    handleError(res, error, 'Failed to update doctor details.');
  }
});

app.delete('/api/doctors/:id', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const index = fallbackDoctors.findIndex((entry) => String(entry._id) === String(req.params.id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      const removed = fallbackDoctors[index];
      fallbackDoctors.splice(index, 1);
      if (removed && removed.email) {
        const userIndex = fallbackUsers.findIndex((entry) => entry.role === 'doctor' && entry.email === removed.email);
        if (userIndex !== -1) fallbackUsers.splice(userIndex, 1);
      }
      return res.json({ success: true, message: 'Doctor profile and login account removed from directory.' });
    }

    const doc = await Doctor.findByIdAndDelete(req.params.id);
    if (doc && doc.email) {
      await User.deleteOne({ email: doc.email, role: 'doctor' });
    }
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    res.json({ success: true, message: 'Doctor profile and login account removed from directory.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete doctor.');
  }
});

// Appointment Routes
app.get('/api/appointments', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      let list = [...fallbackAppointments];
      if (req.user.role === 'patient') {
        list = list.filter(a => String(a.patientId) === String(req.user._id));
      } else if (req.user.role === 'doctor') {
        const doctor = await getDoctorProfileForUser(req.user);
        list = doctor ? list.filter((appointment) => String(appointment.doctorId) === String(doctor._id)) : [];
      }
      return res.json(list.map(a => ({ ...a, id: String(a._id) })));
    }

    let query = {};
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfileForUser(req.user);
      query = doctor ? { doctorId: doctor._id } : { _id: null };
    }
    const appointments = await Appointment.find(query).sort({ createdAt: -1 }).lean();
    res.json(appointments.map(a => ({ ...a, id: String(a._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch appointments.');
  }
});

app.post('/api/appointments', auth('patient'), async (req, res) => {
  try {
    const { doctorId, date, time, villageId, notes } = req.body;
    if (!doctorId || !date || !time || !hasValidAppointmentDate(date, time)) {
      return res.status(400).json({ success: false, message: 'Choose an available doctor and a future date and time.' });
    }

    if (!isMongoConnected()) {
      const doctor = fallbackDoctors.find(d => String(d._id) === String(doctorId));
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      if (!doctor.available) return res.status(409).json({ success: false, message: 'This doctor is not currently accepting appointments.' });
      const conflict = fallbackAppointments.some((appointment) =>
        String(appointment.doctorId) === String(doctor._id) &&
        appointment.date === date && appointment.time === time && appointment.status === 'scheduled'
      );
      if (conflict) return res.status(409).json({ success: false, message: 'This appointment time has already been booked.' });
      const newApp = {
        _id: `app_${Date.now()}`,
        patientId: req.user._id,
        doctorId: String(doctor._id),
        patientName: req.user.name,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        village: req.user.village,
        districtId: req.user.districtId || null,
        talukId: req.user.talukId || null,
        villageId: req.user.villageId || null,
        facilityId: doctor.facilityId || null,
        date,
        time,
        status: 'scheduled',
        token: `NALAM-${Math.floor(10000 + Math.random() * 90000)}`,
        notes: notes || 'Consultation booking'
      };
      fallbackAppointments.unshift(newApp);
      return res.status(201).json({ ...newApp, id: String(newApp._id) });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) return res.status(400).json({ success: false, message: 'Invalid doctor ID.' });
    const doc = await Doctor.findById(doctorId).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    if (!doc.available) return res.status(409).json({ success: false, message: 'This doctor is not currently accepting appointments.' });
    const patientChain = await getLocationChain(req.user.villageId, true);
    const selectedChain = await getLocationChain(villageId || req.user.villageId, true);
    if (!patientChain || !selectedChain || String(patientChain.taluk._id) !== String(selectedChain.taluk._id)) {
      return res.status(403).json({ success: false, message: 'Appointments can only be booked within your verified taluk.' });
    }
    if (String(doc.villageId) !== String(selectedChain.village._id) || !await getLocationChain(doc.villageId, true)) {
      return res.status(400).json({ success: false, message: 'The selected doctor does not serve the chosen verified village.' });
    }
    const conflictingAppointment = await Appointment.exists({ doctorId: doc._id, date, time, status: 'scheduled' });
    if (conflictingAppointment) return res.status(409).json({ success: false, message: 'This appointment time has already been booked.' });

    const tokenNum = Math.floor(10000 + Math.random() * 90000);
    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      patientName: req.user.name,
      doctorName: doc.name,
      specialty: doc.specialty,
      village: selectedChain.village.name,
      districtId: selectedChain.district._id,
      talukId: selectedChain.taluk._id,
      villageId: selectedChain.village._id,
      facilityId: doc.facilityId || null,
      date,
      time,
      status: 'scheduled',
      token: `NALAM-${tokenNum}`,
      notes: notes || 'Consultation booking'
    });

    res.status(201).json({ ...appointment.toObject(), id: String(appointment._id) });
  } catch (error) {
    handleError(res, error, 'Failed to book appointment.');
  }
});

app.put('/api/appointments/:id', auth(), async (req, res) => {
  try {
    const { status } = req.body;
    if (!validAppointmentStatus(status)) {
      return res.status(400).json({ success: false, message: 'Appointment status must be scheduled, completed, or cancelled.' });
    }

    if (!isMongoConnected()) {
      const target = fallbackAppointments.find(a => String(a._id) === String(req.params.id));
      if (!target) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      const ownsAppointment = canPatientManageAppointment(target, req.user);
      const assignedDoctor = await isAssignedDoctor(target, req.user);
      if (req.user.role === 'patient' && (!ownsAppointment || status !== 'cancelled')) {
        return res.status(403).json({ success: false, message: 'Patients may only cancel their own scheduled appointments.' });
      }
      if (req.user.role === 'doctor' && (!assignedDoctor || !['completed', 'cancelled', 'not_visited'].includes(status))) {
        return res.status(403).json({ success: false, message: 'Only the assigned doctor may update this appointment status.' });
      }
      if (target.status !== 'scheduled' || status === 'scheduled') {
        return res.status(409).json({ success: false, message: 'Only scheduled appointments can be completed or cancelled.' });
      }
      target.status = status;
      return res.json({ ...target, id: String(target._id) });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    const ownsAppointment = canPatientManageAppointment(appointment, req.user);
    const assignedDoctor = await isAssignedDoctor(appointment, req.user);
    if (req.user.role === 'patient' && (!ownsAppointment || status !== 'cancelled')) {
      return res.status(403).json({ success: false, message: 'Patients may only cancel their own scheduled appointments.' });
    }
    if (req.user.role === 'doctor' && (!assignedDoctor || !['completed', 'cancelled', 'not_visited'].includes(status))) {
      return res.status(403).json({ success: false, message: 'Only the assigned doctor may update this appointment status.' });
    }
    if (appointment.status !== 'scheduled' || status === 'scheduled') {
      return res.status(409).json({ success: false, message: 'Only scheduled appointments can be completed or cancelled.' });
    }
    appointment.status = status;
    await appointment.save();
    res.json({ ...appointment.toObject(), id: String(appointment._id) });
  } catch (error) {
    handleError(res, error, 'Failed to update appointment.');
  }
});

app.delete('/api/appointments/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const appointment = fallbackAppointments.find(a => String(a._id) === String(req.params.id));
      if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      const ownsAppointment = canPatientManageAppointment(appointment, req.user);
      const assignedDoctor = await isAssignedDoctor(appointment, req.user);
      if (!ownsAppointment && !assignedDoctor && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You are not authorized to cancel this appointment.' });
      }
      if (appointment.status !== 'scheduled') return res.status(409).json({ success: false, message: 'Only scheduled appointments can be cancelled.' });
      appointment.status = 'cancelled';
      return res.json({ success: true, message: 'Appointment cancelled.', doctorName: appointment.doctorName, id: String(appointment._id) });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    const ownsAppointment = canPatientManageAppointment(appointment, req.user);
    const assignedDoctor = await isAssignedDoctor(appointment, req.user);
    if (!ownsAppointment && !assignedDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this appointment.' });
    }
    if (appointment.status !== 'scheduled') return res.status(409).json({ success: false, message: 'Only scheduled appointments can be cancelled.' });
    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ success: true, message: 'Appointment cancelled.', doctorName: appointment.doctorName, id: String(appointment._id) });
  } catch (error) {
    handleError(res, error, 'Failed to cancel appointment.');
  }
});

function validatePrescriptionItems(items) {
  return Array.isArray(items) && items.length > 0 && items.every((item) =>
    item && typeof item.medicine === 'string' && item.medicine.trim() &&
    typeof item.dosage === 'string' && item.dosage.trim() &&
    typeof item.frequency === 'string' && item.frequency.trim() &&
    typeof item.duration === 'string' && item.duration.trim() &&
    (item.instructions === undefined || typeof item.instructions === 'string')
  );
}

app.get('/api/prescriptions', auth(['patient', 'doctor']), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Prescription records require the database connection.' });
    let query = req.user.role === 'patient' ? { patientId: req.user._id } : null;
    if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfileForUser(req.user);
      if (!doctor) return res.json([]);
      query = { doctorId: doctor._id };
    }
    if (req.query.appointmentId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.appointmentId)) return res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
      query.appointmentId = req.query.appointmentId;
    }
    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name village')
      .populate('doctorId', 'name specialty')
      .populate('appointmentId', 'date time status token')
      .sort({ issuedAt: -1 })
      .lean();
    res.json(prescriptions.map((prescription) => ({ ...prescription, id: String(prescription._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch prescriptions.');
  }
});

app.post('/api/prescriptions', auth('doctor'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Prescription records require the database connection.' });
    const { appointmentId, items, notes = '' } = req.body;
    if (!mongoose.Types.ObjectId.isValid(appointmentId) || !validatePrescriptionItems(items)) {
      return res.status(400).json({ success: false, message: 'A valid consultation and at least one complete medicine item are required.' });
    }
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Consultation not found.' });
    if (appointment.status !== 'completed') return res.status(409).json({ success: false, message: 'A prescription can only be recorded for a completed consultation.' });
    if (!await isAssignedDoctor(appointment, req.user)) return res.status(403).json({ success: false, message: 'Only the doctor assigned to this consultation can write its prescription.' });
    const doctor = await getDoctorProfileForUser(req.user);
    if (!doctor) return res.status(403).json({ success: false, message: 'No doctor profile is linked to this account.' });
    const prescription = await Prescription.create({
      patientId: appointment.patientId,
      doctorId: doctor._id,
      appointmentId: appointment._id,
      items,
      notes
    });
    res.status(201).json({ ...prescription.toObject(), id: String(prescription._id) });
  } catch (error) {
    if (error && error.code === 11000) return res.status(409).json({ success: false, message: 'A prescription already exists for this consultation. Update that record instead.' });
    handleError(res, error, 'Failed to save prescription.');
  }
});

app.put('/api/prescriptions/:id', auth('doctor'), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Prescription records require the database connection.' });
    const { items, notes = '' } = req.body;
    if (!validatePrescriptionItems(items)) return res.status(400).json({ success: false, message: 'At least one complete medicine item is required.' });
    const doctor = await getDoctorProfileForUser(req.user);
    if (!doctor) return res.status(403).json({ success: false, message: 'No doctor profile is linked to this account.' });
    const prescription = await Prescription.findOne({ _id: req.params.id, doctorId: doctor._id });
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found for this doctor.' });
    const appointment = await Appointment.findById(prescription.appointmentId);
    if (!appointment || appointment.status !== 'completed') return res.status(409).json({ success: false, message: 'Only prescriptions for completed consultations may be updated.' });
    prescription.items = items;
    prescription.notes = notes;
    await prescription.save();
    res.json({ ...prescription.toObject(), id: String(prescription._id) });
  } catch (error) {
    handleError(res, error, 'Failed to update prescription.');
  }
});

// Medication Reminder Routes (Support both /api/reminders & /api/medication-reminders)
const handleGetReminders = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      let list = [...fallbackReminders];
      if (req.user.role !== 'admin') {
        list = list.filter(r => String(r.patientId) === String(req.user._id));
      }
      return res.json(list.map(r => ({ ...r, id: String(r._id) })));
    }

    const query = req.user.role === 'admin' ? {} : { patientId: req.user._id };
    const reminders = await Reminder.find(query).sort({ createdAt: -1 }).lean();
    res.json(reminders.map(r => ({ ...r, id: String(r._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch medication schedule.');
  }
};

const handlePostReminder = async (req, res) => {
  try {
    const { name, slot, instruction } = req.body;
    if (!isMongoConnected()) {
      const newReminder = {
        _id: `rem_${Date.now()}`,
        patientId: req.user._id,
        name: name || req.body.medicineName,
        slot: slot || 'Morning',
        instruction: instruction || 'Take after food',
        completed: false
      };
      fallbackReminders.unshift(newReminder);
      return res.status(201).json({ ...newReminder, id: String(newReminder._id) });
    }

    const reminder = await Reminder.create({
      patientId: req.user._id,
      name: name || req.body.medicineName,
      slot: slot || 'Morning',
      instruction: instruction || 'Take after food',
      completed: false
    });
    res.status(201).json({ ...reminder.toObject(), id: String(reminder._id) });
  } catch (error) {
    handleError(res, error, 'Failed to save medication reminder.');
  }
};

app.get('/api/reminders', auth('patient'), handleGetReminders);
app.get('/api/medication-reminders', auth('patient'), handleGetReminders);

app.post('/api/reminders', auth('patient'), handlePostReminder);
app.post('/api/medication-reminders', auth('patient'), handlePostReminder);

app.put('/api/reminders/:id', auth('patient'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const reminder = fallbackReminders.find(r => String(r._id) === String(req.params.id) && String(r.patientId) === String(req.user._id));
      if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      reminder.completed = req.body.completed !== undefined ? req.body.completed : !reminder.completed;
      return res.json({ ...reminder, id: String(reminder._id) });
    }

    const reminder = await Reminder.findOne({ _id: req.params.id, patientId: req.user._id });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });

    if (req.body.completed !== undefined) {
      reminder.completed = req.body.completed;
    } else {
      reminder.completed = !reminder.completed;
    }
    await reminder.save();
    res.json({ ...reminder.toObject(), id: String(reminder._id) });
  } catch (error) {
    handleError(res, error, 'Failed to update reminder.');
  }
});

app.put('/api/medication-reminders/:id', auth('patient'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const reminder = fallbackReminders.find(r => String(r._id) === String(req.params.id) && String(r.patientId) === String(req.user._id));
      if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      Object.assign(reminder, req.body);
      return res.json({ ...reminder, id: String(reminder._id) });
    }

    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, patientId: req.user._id }, req.body, { new: true, runValidators: true }).lean();
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ ...reminder, id: String(reminder._id) });
  } catch (error) {
    handleError(res, error, 'Failed to update reminder.');
  }
});

app.delete('/api/reminders/:id', auth('patient'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const index = fallbackReminders.findIndex(r => String(r._id) === String(req.params.id) && String(r.patientId) === String(req.user._id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      fallbackReminders.splice(index, 1);
      return res.json({ success: true, message: 'Reminder deleted.' });
    }

    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true, message: 'Reminder deleted.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete reminder.');
  }
});

app.delete('/api/medication-reminders/:id', auth('patient'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const index = fallbackReminders.findIndex(r => String(r._id) === String(req.params.id) && String(r.patientId) === String(req.user._id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      fallbackReminders.splice(index, 1);
      return res.json({ success: true, message: 'Reminder deleted.' });
    }

    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true, message: 'Reminder deleted.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete reminder.');
  }
});

// Health Camps Routes (Support both /api/camps & /api/health-camps)
const handleGetCamps = async (req, res) => {
  try {
    if (!isMongoConnected()) return res.json([]);

    let query = {};
    let referenceVillageId = null;
    if (req.user.role === 'patient') {
      referenceVillageId = req.user.villageId;
      const currentChain = await getLocationChain(req.user.villageId, true);
      const selectedChain = await getLocationChain(req.query.villageId || req.user.villageId, true);
      if (!currentChain || !selectedChain) return res.json([]);
      if (String(currentChain.taluk._id) !== String(selectedChain.taluk._id)) return res.status(403).json({ success: false, message: 'Camp search is limited to your verified taluk.' });
      query.villageId = selectedChain.village._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfileForUser(req.user);
      if (!doctor || !await getLocationChain(doctor.villageId, true)) return res.json([]);
      referenceVillageId = doctor.villageId;
      const currentChain = await getLocationChain(doctor.villageId, true);
      const selectedChain = await getLocationChain(req.query.villageId || doctor.villageId, true);
      if (!selectedChain || String(currentChain.taluk._id) !== String(selectedChain.taluk._id)) return res.status(403).json({ success: false, message: 'Camp search is limited to your verified taluk.' });
      query.villageId = selectedChain.village._id;
    }
    const camps = await Camp.find(query).sort({ createdAt: -1 }).lean();
    const result = [];
    for (const camp of camps) {
      const chain = await getLocationChain(camp.villageId, true);
      if (!chain) continue;
      result.push({
        ...camp,
        id: String(camp._id),
        isRegistered: (camp.registeredUsers || []).some((userId) => String(userId) === String(req.user._id)),
        districtName: chain.district.name,
        talukName: chain.taluk.name,
        villageName: chain.village.name,
        locationMatch: String(chain.village._id) === String(referenceVillageId) ? 'exact' : 'broader'
      });
    }
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Failed to fetch community health camps.');
  }
};

app.get('/api/camps', auth(), handleGetCamps);
app.get('/api/health-camps', auth(), handleGetCamps);

async function createHealthCamp(req, res) {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Health camp records require the database connection.' });
    const { title, date, doctor, category = 'general', description, districtId, talukId, villageId, facilityId = null, imageUrl = '' } = req.body;
    if (!title || !date || !doctor || !description || !['general', 'eye', 'dental', 'diabetes', 'maternal-child'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Title, date, doctor, description, and a valid camp category are required.' });
    }
    const chain = await getLocationChain(villageId);
    if (!chain || String(chain.district._id) !== String(districtId) || String(chain.taluk._id) !== String(talukId)) {
      return res.status(400).json({ success: false, message: 'Camp district, taluk, and village must form one valid hierarchy.' });
    }
    if (facilityId) {
      if (!mongoose.Types.ObjectId.isValid(facilityId)) return res.status(400).json({ success: false, message: 'Invalid facility ID.' });
      const facility = await Facility.findOne({ _id: facilityId, active: true });
      if (!facility || String(facility.villageId) !== String(villageId)) {
        return res.status(400).json({ success: false, message: 'The selected facility must belong to the camp village.' });
      }
    }
    if (imageUrl && !hasSourceUrl(imageUrl)) return res.status(400).json({ success: false, message: 'Camp image URL must use HTTP or HTTPS.' });
    const camp = await Camp.create({
      title: title.trim(), date, doctor: doctor.trim(), category, description: description.trim(), imageUrl,
      districtId, talukId, villageId, village: chain.village.name, facilityId,
      registeredCount: 0, registeredUsers: []
    });
    res.status(201).json({ ...camp.toObject(), id: String(camp._id), isRegistered: false });
  } catch (error) {
    handleError(res, error, 'Failed to create health camp.');
  }
}

app.post('/api/camps', auth('admin'), createHealthCamp);
app.post('/api/health-camps', auth('admin'), createHealthCamp);

app.post('/api/camps/:id/register', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'patient') return res.status(403).json({ success: false, message: 'Only patients can register interest in a health camp.' });
    if (!isMongoConnected()) {
      return res.status(404).json({ success: false, message: 'No verified local camp record is available.' });
    }

    const camp = await Camp.findById(req.params.id);
    if (!camp) return res.status(404).json({ success: false, message: 'Health camp not found.' });
    if (!await getLocationChain(camp.villageId, true) || String(camp.villageId) !== String(req.user.villageId)) {
      return res.status(404).json({ success: false, message: 'This camp is not available in your verified village.' });
    }

    const userIdStr = String(req.user._id);
    const existingIndex = (camp.registeredUsers || []).findIndex(uid => String(uid) === userIdStr);

    if (existingIndex !== -1) {
      camp.registeredUsers.splice(existingIndex, 1);
      camp.registeredCount = Math.max(0, camp.registeredCount - 1);
    } else {
      camp.registeredUsers.push(req.user._id);
      camp.registeredCount += 1;
    }

    await camp.save();
    res.json({ ...camp.toObject(), id: String(camp._id), isRegistered: existingIndex === -1 });
  } catch (error) {
    handleError(res, error, 'Failed to toggle camp registration.');
  }
});

app.delete('/api/camps/:id', auth('admin'), async (req, res) => {
  try {
    const camp = await Camp.findByIdAndDelete(req.params.id);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found.' });
    res.json({ success: true, message: 'Health camp removed.' });
  } catch (error) {
    handleError(res, error, 'Failed to remove camp.');
  }
});

// Awareness Articles Routes
app.get('/api/awareness', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.json(fallbackAwareness.map(a => ({ ...a, id: String(a._id) })));
    }

    const articles = await Awareness.find().sort({ createdAt: -1 }).lean();
    res.json(articles.map(a => ({ ...a, id: String(a._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch awareness guides.');
  }
});

// Sector Patients (Doctor & Admin access)
app.get('/api/patients', auth(['doctor', 'admin']), async (req, res) => {
  try {
    if (!isMongoConnected()) return res.json([]);

    const query = { role: 'patient' };
    if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfileForUser(req.user);
      if (!doctor || !await getLocationChain(doctor.villageId, true)) return res.json([]);
      query.villageId = doctor.villageId;
    }
    const patients = await User.find(query).select('-passwordHash').sort({ name: 1 }).lean();
    const result = patients.map((patient) => ({
      id: String(patient._id),
      name: patient.name,
      mobile: patient.mobile,
      village: patient.village,
      villageId: patient.villageId,
      gender: patient.gender || 'Male',
      dob: patient.dob || ''
    }));
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Failed to fetch patients roster.');
  }
});

// All System Users (Admin Access)
app.get('/api/users', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.json(fallbackUsers.map(u => publicUser(u)));
    }

    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json(users.map(u => publicUser(u)));
  } catch (error) {
    handleError(res, error, 'Failed to fetch system user accounts.');
  }
});

// Emergency Hotlines
app.get('/api/emergency', auth(), (req, res) => {
  res.json([
    { id: 'em_1', name: 'Government Medical Emergency Ambulance', number: '108', icon: 'emergency', badge: 'National Toll-Free 24/7' },
    { id: 'em_2', name: 'National Emergency Response System', number: '112', icon: 'call', badge: 'All Emergencies 24/7' }
  ]);
});

// Admin Metrics Summary
app.get('/api/admin/summary', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.json({
        success: true,
        users: fallbackUsers.length,
        doctors: fallbackDoctors.length,
        appointments: fallbackAppointments.length,
        reminders: fallbackReminders.length,
        camps: fallbackCamps.length
      });
    }

    const [users, doctors, appointments, reminders, camps] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Reminder.countDocuments(),
      Camp.countDocuments()
    ]);
    res.json({ success: true, users, doctors, appointments, reminders, camps });
  } catch (error) {
    handleError(res, error, 'Failed to fetch admin summary.');
  }
});

// Static App Serving
app.use(express.static(path.join(__dirname)));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  next();
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

/* =========================================================================
   4. DATABASE SEEDING MECHANISM
   ========================================================================= */

async function seedDatabase() {
  try {
    // Seed Demo Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial authentic demo user accounts into MongoDB...');
      await User.create([
        {
          name: 'Muthuswamy S.',
          email: 'patient@nalam360.test',
          mobile: '9876543210',
          passwordHash: createPasswordHash('patient123'),
          role: 'patient',
          village: 'Melur',
          gender: 'Male',
          dob: '1982-06-15'
        },
        {
          name: 'Dr. Arumugam K.',
          email: 'doctor@nalam360.test',
          mobile: '9888888888',
          passwordHash: createPasswordHash('doctor123'),
          role: 'doctor',
          village: 'Melur',
          gender: 'Male'
        },
        {
          name: 'Nalam Administrator',
          email: 'admin@nalam360.test',
          mobile: '9999999999',
          passwordHash: createPasswordHash('admin123'),
          role: 'admin',
          village: 'Central Office',
          gender: 'Female'
        }
      ]);
    }

    // Seed Doctors
    const doctorCount = await Doctor.countDocuments();
    if (doctorCount === 0) {
      console.log('Seeding doctors roster into MongoDB...');
      await Doctor.create([
        { name: 'Dr. Arumugam K.', specialty: 'General Medicine', village: 'Melur', experience: 14, fee: 150, available: true, initials: 'AK', nextSlot: 'Today, 4:30 PM', email: 'doctor@nalam360.test' },
        { name: 'Dr. Meenakshi S.', specialty: 'Pediatrics', village: 'Karur', experience: 10, fee: 200, available: true, initials: 'MS', nextSlot: 'Tomorrow, 10:00 AM', email: 'meenakshi@nalam360.test' },
        { name: 'Dr. Ramanathan V.', specialty: 'Cardiology', village: 'Hosur', experience: 18, fee: 350, available: true, initials: 'RV', nextSlot: 'Today, 6:00 PM', email: 'raman@nalam360.test' },
        { name: 'Dr. Kavitha P.', specialty: 'Gynecology', village: 'Sivakasi', experience: 12, fee: 250, available: true, initials: 'KP', nextSlot: 'Tomorrow, 11:30 AM', email: 'kavitha@nalam360.test' },
        { name: 'Dr. Murugan T.', specialty: 'Ophthalmology', village: 'Pollachi', experience: 8, fee: 180, available: false, initials: 'MT', nextSlot: 'Friday, 2:00 PM', email: 'murugan@nalam360.test' }
      ]);
    }

    // Seed Health Camps
    const campCount = await Camp.countDocuments();
    if (campCount === 0) {
      console.log('Seeding health camps into MongoDB...');
      await Camp.create([
        { title: 'Free Village Eye Screening Camp', village: 'Melur', date: 'Oct 24, 2026', doctor: 'Dr. Murugan T.', specialty: 'Ophthalmology', description: 'Free vision checks, cataract screenings, and prescription eyeglasses guidance for all villagers.', registeredCount: 42 },
        { title: 'Community Diabetes & BP Screening', village: 'Karur', date: 'Oct 28, 2026', doctor: 'Dr. Arumugam K.', specialty: 'General Medicine', description: 'Comprehensive blood pressure and blood sugar checks with free dietary counseling.', registeredCount: 68 },
        { title: 'Pediatric Wellness & Nutrition Camp', village: 'Sivakasi', date: 'Nov 05, 2026', doctor: 'Dr. Meenakshi S.', specialty: 'Pediatrics', description: 'Child growth monitoring, vaccination consultations, and nutritional supplement distribution.', registeredCount: 35 }
      ]);
    }

    // Seed Awareness Articles
    const awarenessCount = await Awareness.countDocuments();
    if (awarenessCount === 0) {
      console.log('Seeding health awareness articles into MongoDB...');
      await Awareness.create([
        { title: 'Hydration During Agricultural Field Work', category: 'General Health', readTime: '3 min read', snippet: 'Essential advice for farm workers to prevent heatstroke, electrolyte imbalance, and kidney strain in hot weather.', content: 'Drink clean water at regular 30-minute intervals. Avoid excessive tea or coffee during peak sun hours. If feeling dizzy, rest under shade and consume electrolyte or fresh tender coconut water immediately.' },
        { title: 'Managing Blood Pressure Naturally', category: 'Cardiology', readTime: '4 min read', snippet: 'Practical dietary adjustments and exercise routines tailored for rural Indian lifestyles.', content: 'Reduce daily salt intake in meals. Incorporate 30 minutes of brisk morning walking. Avoid tobacco in any form and schedule BP checks once every month at your local primary health center.' },
        { title: 'Childhood Vaccination Milestones', category: 'Pediatrics', readTime: '5 min read', snippet: 'A quick reference guide for parents on mandatory vaccines from birth to 5 years.', content: 'Ensure your child receives BCG, Polio, Pentavalent, and MMR immunizations on schedule. Keep your Mother & Child Protection Card updated during primary health center visits.' }
      ]);
    }

    // Seed Sample Reminders for Patient
    const patientUser = await User.findOne({ email: 'patient@nalam360.test' });
    if (patientUser) {
      const remCount = await Reminder.countDocuments({ patientId: patientUser._id });
      if (remCount === 0) {
        console.log('Seeding medication reminders into MongoDB...');
        await Reminder.create([
          { patientId: patientUser._id, name: 'Metformin 500mg', slot: 'Morning', instruction: 'Take after breakfast', completed: true },
          { patientId: patientUser._id, name: 'Amlodipine 5mg', slot: 'Morning', instruction: 'With water after breakfast', completed: true },
          { patientId: patientUser._id, name: 'Multivitamin', slot: 'Afternoon', instruction: 'After lunch', completed: false },
          { patientId: patientUser._id, name: 'Atorvastatin 10mg', slot: 'Night', instruction: 'Before sleep', completed: false }
        ]);
      }

      const appCount = await Appointment.countDocuments({ patientId: patientUser._id });
      const mainDoctor = await Doctor.findOne({ name: 'Dr. Arumugam K.' });
      if (appCount === 0 && mainDoctor) {
        console.log('Seeding appointments into MongoDB...');
        await Appointment.create([
          {
            patientId: patientUser._id,
            doctorId: mainDoctor._id,
            patientName: patientUser.name,
            doctorName: mainDoctor.name,
            specialty: mainDoctor.specialty,
            village: patientUser.village,
            date: '2026-09-22',
            time: '10:30 AM',
            status: 'scheduled',
            token: 'NALAM-48291',
            notes: 'Routine blood pressure review'
          }
        ]);
      }
    }

  } catch (err) {
    console.error('Seed execution error:', err.message);
  }
}

/* =========================================================================
   5. SERVER INITIALIZATION & MONGODB CONNECTION
   ========================================================================= */

async function bootstrapAdminAccount() {
  try {
    const name = process.env.ADMIN_NAME;
    const mobile = String(process.env.ADMIN_MOBILE || '').replace(/\D/g, '');
    const password = process.env.ADMIN_PASSWORD;
    if (!name || mobile.length !== 10 || !password || password.length < 12) {
      console.log('No administrator bootstrap configured; set ADMIN_NAME, ADMIN_MOBILE, and a 12+ character ADMIN_PASSWORD if required.');
      return;
    }
    const existingAdmin = await User.findOne({ role: 'admin' }).select('_id').lean();
    if (existingAdmin) return;
    const existingAccount = await User.findOne({ mobile }).select('_id').lean();
    if (existingAccount) throw new Error('Configured administrator mobile is already assigned to another account.');
    await User.create({
      name: name.trim(),
      email: String(process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
      mobile,
      passwordHash: createPasswordHash(password),
      role: 'admin',
      village: process.env.ADMIN_VILLAGE || 'Unassigned',
      gender: 'Other'
    });
    console.log('Bootstrapped the configured administrator account.');
  } catch (err) {
    console.error('Administrator bootstrap failed:', err.message);
  }
}

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB database (nalam360) successfully.');
    await bootstrapAdminAccount();
  } catch (err) {
    console.error(`MongoDB connection notice (${err.name}).`);
    console.log('Server starting in resilient API mode.');
  }

  return app.listen(PORT, () => {
    console.log(`Nalam360 Server running at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start Nalam360 server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
module.exports.models = { User, Doctor, Appointment, Reminder, Camp, Awareness, Location, Facility, Prescription };
