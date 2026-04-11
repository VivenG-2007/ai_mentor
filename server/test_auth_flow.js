const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testAuthFlow() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to DB');

    const testEmail = 'test-' + Date.now() + '@example.com';
    const testPassword = 'password123';

    console.log('--- Testing Register ---');
    const user = await User.create({
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });
    console.log('✅ User registered:', user.email);

    console.log('--- Testing Login ---');
    const foundUser = await User.findOne({ email: testEmail }).select('+password');
    if (!foundUser) {
      console.error('❌ User not found after registration!');
      return;
    }

    const isMatch = await foundUser.comparePassword(testPassword);
    console.log('Password match:', isMatch);
    
    if (isMatch) {
      console.log('✅ Login successful simulation');
    } else {
      console.error('❌ Password match failed!');
    }

    // Cleanup
    await User.deleteOne({ _id: user._id });
    console.log('✅ Test user cleaned up');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}

testAuthFlow();
