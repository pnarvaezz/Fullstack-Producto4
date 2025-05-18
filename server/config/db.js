const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✔ MongoDB conectado vía Mongoose');
  } catch (err) {
    console.error('✘ Error al conectar', err);
    process.exit(1);
  }
}
module.exports = connectDB;
