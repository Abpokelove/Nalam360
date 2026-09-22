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
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'nalam360_production_jwt_secret_key_2026_secure';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
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
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
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
  date: { type: String, required: true, trim: true },
  doctor: { type: String, required: true, trim: true },
  specialty: { type: String, default: 'General Screening' },
  description: { type: String, required: true, trim: true },
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

const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema, 'doctors');
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema, 'appointments');
const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema, 'reminders');
const Camp = mongoose.models.Camp || mongoose.model('Camp', campSchema, 'camps');
const Awareness = mongoose.models.Awareness || mongoose.model('Awareness', awarenessSchema, 'awareness');

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
    gender: user.gender || 'Male',
    dob: user.dob || ''
  };
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

/* =========================================================================
   3. EXPRESS REST API ENDPOINTS
   ========================================================================= */

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', service: 'Nalam360 Express API', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, mobile, password, village, gender, dob } = req.body;
    if (!name || !mobile || !password || !village) {
      return res.status(400).json({ success: false, message: 'Full name, 10-digit mobile, village sector, and password are required.' });
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
    const { name, village, gender, dob } = req.body;
    if (!isMongoConnected()) {
      const target = fallbackUsers.find((user) => String(user._id) === String(req.user._id));
      if (!target) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      target.name = name || target.name;
      target.village = village || target.village;
      target.gender = gender || target.gender;
      target.dob = dob || target.dob;
      return res.json({ success: true, user: publicUser(target), message: 'Profile details updated.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, village, gender, dob },
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
      return res.json(fallbackDoctors.map(d => ({ ...d, id: String(d._id) })));
    }

    const { specialty, village, search } = req.query;
    const filter = {};
    if (specialty) filter.specialty = specialty;
    if (village) filter.village = village;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } }
      ];
    }
    const doctors = await Doctor.find(filter).sort({ name: 1 }).lean();
    res.json(doctors.map(d => ({ ...d, id: String(d._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch doctor directory.');
  }
});

app.get('/api/doctors/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const doctor = fallbackDoctors.find(d => String(d._id) === String(req.params.id));
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      return res.json({ ...doctor, id: String(doctor._id) });
    }

    const doctor = await Doctor.findById(req.params.id).lean();
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    res.json({ ...doctor, id: String(doctor._id) });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid doctor ID.' });
  }
});

app.post('/api/doctors', auth('admin'), async (req, res) => {
  try {
    const { name, email, mobile, password, specialty, village, experience, fee, available } = req.body;

    if (!name || !specialty || !village) {
      return res.status(400).json({ success: false, message: 'Doctor name, specialty, and village sector are required.' });
    }

    const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : `98888${Math.floor(10000 + Math.random() * 90000)}`;
    const docEmail = (email || '').trim().toLowerCase() || `doctor_${Date.now()}@nalam360.test`;
    const docPassword = password || 'doctor123';

    if (!isMongoConnected()) {
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

    // 1. Create Doctor Profile Entry
    const initials = (name || 'DR').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const doc = await Doctor.create({
      name: name.trim(),
      email: docEmail,
      specialty: specialty.trim(),
      village: village.trim(),
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
        village: village.trim(),
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

    if (!isMongoConnected()) {
      const doc = fallbackDoctors.find((entry) => String(entry._id) === String(req.params.id));
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      Object.assign(doc, doctorData);
      if (password && password.length >= 4 && doc.email) {
        const user = fallbackUsers.find((entry) => entry.role === 'doctor' && entry.email === doc.email);
        if (user) {
          user.passwordHash = createPasswordHash(password);
        }
      }
      return res.json({ ...doc, id: String(doc._id) });
    }

    const doc = await Doctor.findByIdAndUpdate(req.params.id, doctorData, { new: true, runValidators: true }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    // Update associated User account password if provided
    if (password && password.length >= 4 && doc.email) {
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
        list = list.filter(a => a.doctorName.toLowerCase().includes(req.user.name.toLowerCase().replace('dr. ', '')) || a.village === req.user.village);
      }
      return res.json(list.map(a => ({ ...a, id: String(a._id) })));
    }

    let query = {};
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      query = { $or: [{ doctorName: { $regex: req.user.name.replace('Dr. ', ''), $options: 'i' } }, { village: req.user.village }] };
    }
    const appointments = await Appointment.find(query).sort({ createdAt: -1 }).lean();
    res.json(appointments.map(a => ({ ...a, id: String(a._id) })));
  } catch (error) {
    handleError(res, error, 'Failed to fetch appointments.');
  }
});

app.post('/api/appointments', auth(), async (req, res) => {
  try {
    const { doctorId, date, time, village, notes } = req.body;
    if (!isMongoConnected()) {
      const doctor = fallbackDoctors.find(d => String(d._id) === String(doctorId)) || fallbackDoctors[0];
      const newApp = {
        _id: `app_${Date.now()}`,
        patientId: req.user._id,
        doctorId: String(doctor._id),
        patientName: req.user.name,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        village: village || req.user.village,
        date: date || new Date().toISOString().split('T')[0],
        time: time || '10:00 AM',
        status: 'scheduled',
        token: `NALAM-${Math.floor(10000 + Math.random() * 90000)}`,
        notes: notes || 'Consultation booking'
      };
      fallbackAppointments.unshift(newApp);
      return res.status(201).json({ ...newApp, id: String(newApp._id) });
    }

    let doctorName = 'Dr. Arumugam K.';
    let specialty = 'General Medicine';

    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      const doc = await Doctor.findById(doctorId).lean();
      if (doc) {
        doctorName = doc.name;
        specialty = doc.specialty;
      }
    }

    const tokenNum = Math.floor(10000 + Math.random() * 90000);
    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctorId && mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null,
      patientName: req.user.name,
      doctorName,
      specialty,
      village: village || req.user.village,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00 AM',
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
    if (!isMongoConnected()) {
      const target = fallbackAppointments.find(a => String(a._id) === String(req.params.id));
      if (!target) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      target.status = req.body.status || target.status;
      return res.json({ ...target, id: String(target._id) });
    }

    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    res.json({ ...appointment, id: String(appointment._id) });
  } catch (error) {
    handleError(res, error, 'Failed to update appointment.');
  }
});

app.delete('/api/appointments/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const index = fallbackAppointments.findIndex(a => String(a._id) === String(req.params.id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      fallbackAppointments.splice(index, 1);
      return res.json({ success: true, message: 'Appointment cancelled.' });
    }

    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    res.json({ success: true, message: 'Appointment cancelled.' });
  } catch (error) {
    handleError(res, error, 'Failed to cancel appointment.');
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

app.get('/api/reminders', auth(), handleGetReminders);
app.get('/api/medication-reminders', auth(), handleGetReminders);

app.post('/api/reminders', auth(), handlePostReminder);
app.post('/api/medication-reminders', auth(), handlePostReminder);

app.put('/api/reminders/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const reminder = fallbackReminders.find(r => String(r._id) === String(req.params.id));
      if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      reminder.completed = req.body.completed !== undefined ? req.body.completed : !reminder.completed;
      return res.json({ ...reminder, id: String(reminder._id) });
    }

    const reminder = await Reminder.findById(req.params.id);
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

app.put('/api/medication-reminders/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const reminder = fallbackReminders.find(r => String(r._id) === String(req.params.id));
      if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      Object.assign(reminder, req.body);
      return res.json({ ...reminder, id: String(reminder._id) });
    }

    const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ ...reminder, id: String(reminder._id) });
  } catch (error) {
    handleError(res, error, 'Failed to update reminder.');
  }
});

app.delete('/api/reminders/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const index = fallbackReminders.findIndex(r => String(r._id) === String(req.params.id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      fallbackReminders.splice(index, 1);
      return res.json({ success: true, message: 'Reminder deleted.' });
    }

    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true, message: 'Reminder deleted.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete reminder.');
  }
});

app.delete('/api/medication-reminders/:id', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const index = fallbackReminders.findIndex(r => String(r._id) === String(req.params.id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found.' });
      fallbackReminders.splice(index, 1);
      return res.json({ success: true, message: 'Reminder deleted.' });
    }

    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true, message: 'Reminder deleted.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete reminder.');
  }
});

// Health Camps Routes (Support both /api/camps & /api/health-camps)
const handleGetCamps = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const result = fallbackCamps.map(c => {
        const isReg = req.user ? (c.registeredUsers || []).some(uid => String(uid) === String(req.user._id)) : false;
        return { ...c, id: String(c._id), isRegistered: isReg };
      });
      return res.json(result);
    }

    const camps = await Camp.find().sort({ createdAt: -1 }).lean();
    const result = camps.map(c => {
      const isReg = req.user ? (c.registeredUsers || []).some(uid => String(uid) === String(req.user._id)) : false;
      return { ...c, id: String(c._id), isRegistered: isReg };
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Failed to fetch community health camps.');
  }
};

app.get('/api/camps', auth(), handleGetCamps);
app.get('/api/health-camps', auth(), handleGetCamps);

app.post('/api/camps', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const camp = {
        _id: `camp_${Date.now()}`,
        ...req.body,
        registeredCount: 0,
        registeredUsers: []
      };
      fallbackCamps.unshift(camp);
      return res.status(201).json({ ...camp, id: String(camp._id), isRegistered: false });
    }

    const camp = await Camp.create(req.body);
    res.status(201).json({ ...camp.toObject(), id: String(camp._id), isRegistered: false });
  } catch (error) {
    handleError(res, error, 'Failed to create health camp.');
  }
});

app.post('/api/health-camps', auth('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const camp = {
        _id: `camp_${Date.now()}`,
        ...req.body,
        registeredCount: 0,
        registeredUsers: []
      };
      fallbackCamps.unshift(camp);
      return res.status(201).json({ ...camp, id: String(camp._id), isRegistered: false });
    }

    const camp = await Camp.create(req.body);
    res.status(201).json({ ...camp.toObject(), id: String(camp._id), isRegistered: false });
  } catch (error) {
    handleError(res, error, 'Failed to create health camp.');
  }
});

app.post('/api/camps/:id/register', auth(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const camp = fallbackCamps.find(c => String(c._id) === String(req.params.id));
      if (!camp) return res.status(404).json({ success: false, message: 'Health camp not found.' });

      const userIdStr = String(req.user._id);
      const existingIndex = (camp.registeredUsers || []).findIndex(uid => String(uid) === userIdStr);
      if (existingIndex !== -1) {
        camp.registeredUsers.splice(existingIndex, 1);
        camp.registeredCount = Math.max(0, camp.registeredCount - 1);
      } else {
        camp.registeredUsers.push(req.user._id);
        camp.registeredCount += 1;
      }
      return res.json({ ...camp, id: String(camp._id), isRegistered: existingIndex === -1 });
    }

    const camp = await Camp.findById(req.params.id);
    if (!camp) return res.status(404).json({ success: false, message: 'Health camp not found.' });

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
    if (!isMongoConnected()) {
      return res.json(fallbackPatients);
    }

    const patients = await User.find({ role: 'patient' }).select('-passwordHash').sort({ name: 1 }).lean();
    const result = patients.map(p => ({
      id: String(p._id),
      name: p.name,
      mobile: p.mobile,
      village: p.village,
      gender: p.gender || 'Male',
      age: 38,
      primaryConcern: 'Routine Screening',
      lastVisit: '2026-09-12'
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

async function startServer() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB database (nalam360) successfully.');
    await seedDatabase();
  } catch (err) {
    console.error(`MongoDB connection notice (${err.name}): ${err.message}`);
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
module.exports.models = { User, Doctor, Appointment, Reminder, Camp, Awareness };
