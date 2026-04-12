const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: null,
  },
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark',
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
  },
  profession: { type: String, default: '' },
  careerTrack: {
    type: String,
    enum: ['SDE', 'Data Science', 'Product Management', 'General'],
    default: 'General',
  },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  skills: {
    type: Map,
    of: Number,
    default: {},
  },
  mentorPreference: {
    tone: { type: String, enum: ['encouraging', 'rigorous', 'funny', 'professional'], default: 'professional' },
    avatarId: { type: String, default: 'default' },
  },
  goals: [String],
  weeklySessionDay: {
    type: Number,
    default: 1, // Monday
    min: 0,
    max: 6,
  },
  totalSessions: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};


userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
