const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the same directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    return;
  }
  
  console.log('Testing connection to:', uri.replace(/:([^@]+)@/, ':****@'));
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Connection successful!');
    
    // Try to list collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
