import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const app = express();
// Middleware
app.use(cors({
  origin: 'http://localhost:3000',  // Allow only this frontend
  methods: ['GET', 'POST'],         // Allow specific methods
  credentials: true                 // Allow cookies/auth headers
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded());
app.use(express.static("public"));
app.use(cookieParser());

//routrs 
import { userRouter } from './routes/user.route.js';
app.use("/api/users", userRouter);
export { app };