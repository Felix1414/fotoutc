import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from 'formidable';
import fs from 'fs';
import dbConnect from '../../../lib/db';
import { Photo } from '../../../models/Photo';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const form = formidable();
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          return res.status(500).json({ error: 'Error parsing form' });
        }

        const fileArray = files.file as formidable.File[] | undefined;
        if (!fileArray || fileArray.length === 0) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = fileArray[0];
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description || '';
        const location = Array.isArray(fields.location) ? fields.location[0] : fields.location || '';

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const fileName = `photos/${Date.now()}-${file.originalFilename}`;
        const fileContent = fs.readFileSync(file.filepath);

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: fileName,
          Body: fileContent,
          ContentType: file.mimetype!,
        });

        await s3Client.send(command);

        const photoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        const newPhoto = new Photo({
          imageUrl: photoUrl,
          description,
          location,
          user: decoded.userId,
        });

        await newPhoto.save();

        res.status(201).json(newPhoto);
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ error: 'Error uploading photo' });
    }
  } else if (req.method === 'GET') {
    try {
      const photos = await Photo.find().populate('user', 'name profilePicture').sort({ createdAt: -1 });
      res.status(200).json(photos);
    } catch (error) {
      console.error('Error fetching photos:', error);
      res.status(500).json({ error: 'Error fetching photos' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}