import mongoose from 'mongoose';
import config from './../config';

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);
mongoose.connection.on('connected', () => {
  console.log(`Mongoose default connection open to ${config.DEIP_MONGO_STORAGE_CONNECTION_URL}`);
});
mongoose.connection.on('error', (err) => {
  console.log(`Mongoose default connection error: ${err}`);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose default connection closed through app termination');
    process.exit(0);
  });
});
