import dotenv from 'dotenv';
dotenv.config({ path: "../.env" });
import connectDB from './db/db.js';
import { app } from './app.js';

const PORT = process.env.PORT || 5000; // make sure PORT is defined
console.log("Mongo URI:", process.env.MONGO_URI);
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
