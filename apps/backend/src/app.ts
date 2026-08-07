import express from "express";
import { createApiRouter } from "./api/routes";
import { db } from "./db/db";
import { sql } from "kysely";
import cors from 'cors'
import { toNodeHandler } from "better-auth/node";
import {auth} from './utils/auth'
import 'dotenv'

export const app = express();

const frontendLoc = process.env.TRUSTED_FRONTEND
console.log('🔒 TRUSTED_FRONTEND env var:', JSON.stringify(frontendLoc));
app.use((req, res, next) => {
  
  next();
});
app.use(cors(
  {
    origin: frontendLoc, // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT","PATCH", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }
));


app.use(express.json());
// Middleware


app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json({ limit: '10mb' }));


app.use('/api',createApiRouter())