const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
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
