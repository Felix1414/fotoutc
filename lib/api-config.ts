import { MongoClient, ObjectId } from 'mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';
import emailjs from '@emailjs/browser';
import nodemailer from 'nodemailer';

// MongoDB Configuration
const mongoClient = new MongoClient(process.env.MONGODB_URI as string);

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Email.js Configuration
const emailjsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
};

// Gmail Configuration
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// News API Configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// JWT Configuration
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    return null;
  }
};

const createToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string);
};

// MongoDB Functions
async function connectToDatabase() {
  if (!mongoClient.isConnected()) await mongoClient.connect();
  return mongoClient.db('fotoUTC');
}

export async function getUserById(userId: string) {
  const db = await connectToDatabase();
  const users = db.collection('users');
  return users.findOne({ _id: new ObjectId(userId) });
}

export async function updateUser(userId: string, updateData: any) {
  const db = await connectToDatabase();
  const users = db.collection('users');
  return users.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
}

// S3 Functions
export async function uploadFileToS3(file: Buffer, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    Key: fileName,
    Body: file,
  });

  try {
    const response = await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

// Email.js Function
export async function sendEmailWithEmailJS(templateParams: any) {
  try {
    const response = await emailjs.send(
      emailjsConfig.serviceId as string,
      emailjsConfig.templateId as string,
      templateParams,
      emailjsConfig.publicKey as string
    );
    return response;
  } catch (error) {
    console.error('Error sending email with Email.js:', error);
    throw error;
  }
}

// Gmail Function
export async function sendEmailWithGmail(to: string, subject: string, text: string) {
  try {
    const info = await gmailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    });
    return info;
  } catch (error) {
    console.error('Error sending email with Gmail:', error);
    throw error;
  }
}

// News API Function
export async function fetchNews() {
  const url = `https://newsapi.org/v2/top-headlines?country=mx&apiKey=${NEWS_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API responded with status: ${response.status}`);
    }
    const data = await response.json();
    return data.articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}

export {
  mongoClient,
  s3Client,
  emailjsConfig,
  gmailTransporter,
  PAYPAL_CLIENT_ID,
  NEWS_API_KEY,
  verifyToken,
  createToken,
};
