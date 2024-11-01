import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from 'multer';
import { promisify } from 'util';

interface MulterNextApiRequest extends NextApiRequest {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

const runMiddleware = promisify((req: MulterNextApiRequest, res: NextApiResponse, fn: Function) => {
  return upload.single('file')(req as any, res as any, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'An unknown error occurred' });
    }
    return fn(null);
  });
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: MulterNextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await runMiddleware(req, res);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileName = `profile-pictures/${Date.now()}-${file.originalname}`;
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await s3Client.send(command);

      // Construye la URL pública
      const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      res.status(200).json({ url: publicUrl, key: fileName });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Error uploading file' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}