import dotenv from 'dotenv';
import connectDB from './db/db.js';
import { app } from './app.js';
import { Router } from 'express';
dotenv.config();

const PORT = process.env.PORT || 5000; // make sure PORT is defined

// Connect DB and then start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to DB', error);
    process.exit(1); // Exit app if DB connection fails
  });
