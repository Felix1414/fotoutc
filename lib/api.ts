import { S3Client } from '@aws-sdk/client-s3';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import emailjs from '@emailjs/browser';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// MongoDB Configuration
export const mongoClient = new MongoClient(process.env.MONGODB_URI as string);

// AWS S3 Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Email.js Configuration
export const emailjsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
};

// Gmail Configuration
export const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// PayPal Configuration
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// News API Configuration
export const NEWS_API_KEY = process.env.NEWS_API_KEY;

// JWT Configuration
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    return null;
  }
};

export const createToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string);
};
