import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import authRouter from './routes/auth.js';

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

process.on('unhandledRejection', (e)=> console.error(e));
app.listen(process.env.PORT || 4000, () =>
  console.log('API running on port', process.env.PORT || 4000)
);