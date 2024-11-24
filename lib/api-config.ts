import { MongoClient, ObjectId } from 'mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';
import emailjs from '@emailjs/browser';
import nodemailer from 'nodemailer';

// MongoDB Configuration
let mongoClient: MongoClient;
let mongoClientPromise: Promise<MongoClient>;

// Conexión reutilizable para MongoDB en entornos de servidor como Render
if (!mongoClient) {
  mongoClient = new MongoClient(process.env.MONGODB_URI as string);
  mongoClientPromise = mongoClient.connect();
}

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

// JWT Configuration
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    console.error('Error verificando el token:', error);
    return null;
  }
};

const createToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
};

// MongoDB Functions
async function connectToDatabase() {
  try {
    const client = await mongoClientPromise;
    return client.db('fotoUTC');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw error;
  }
}

async function getUserById(userId: string) {
  try {
    const db = await connectToDatabase();
    const users = db.collection('users');
    return users.findOne({ _id: new ObjectId(userId) });
  } catch (error) {
    console.error('Error obteniendo usuario por ID:', error);
    throw error;
  }
}

async function updateUser(userId: string, updateData: any) {
  try {
    const db = await connectToDatabase();
    const users = db.collection('users');
    return users.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    throw error;
  }
}

// S3 Functions
async function uploadFileToS3(file: Buffer, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    Key: fileName,
    Body: file,
    ContentType: 'application/octet-stream',
  });

  try {
    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error subiendo archivo a S3:', error);
    throw error;
  }
}

// Email.js Function
async function sendEmailWithEmailJS(templateParams: any) {
  try {
    const response = await emailjs.send(
      emailjsConfig.serviceId as string,
      emailjsConfig.templateId as string,
      templateParams,
      emailjsConfig.publicKey as string
    );
    return response;
  } catch (error) {
    console.error('Error enviando email con Email.js:', error);
    throw error;
  }
}

// Gmail Function
async function sendEmailWithGmail(to: string, subject: string, text: string) {
  try {
    const info = await gmailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    });
    return info;
  } catch (error) {
    console.error('Error enviando email con Gmail:', error);
    throw error;
  }
}

// Fetch News API Function
async function fetchNews() {
  const url = `https://newsapi.org/v2/top-headlines?country=mx&apiKey=${process.env.NEWS_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API respondió con estado: ${response.status}`);
    }
    const data = await response.json();
    return data.articles;
  } catch (error) {
    console.error('Error obteniendo noticias:', error);
    throw error;
  }
}

// Export
export {
  s3Client,
  emailjsConfig,
  gmailTransporter,
  verifyToken,
  createToken,
  connectToDatabase,
  getUserById,
  updateUser,
  uploadFileToS3,
  sendEmailWithEmailJS,
  sendEmailWithGmail,
  fetchNews,
};
