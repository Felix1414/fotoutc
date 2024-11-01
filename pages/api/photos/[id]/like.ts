import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import { Photo } from '../../../../models/Photo';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid photo ID' });
      }

      const decodedId = decodeURIComponent(id);

      if (!ObjectId.isValid(decodedId)) {
        return res.status(400).json({ message: 'Invalid photo ID format' });
      }

      const photo = await Photo.findById(decodedId);

      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      const userIndex = photo.likes.indexOf(decoded.userId);
      if (userIndex > -1) {
        // User has already liked the photo, so remove the like
        photo.likes.splice(userIndex, 1);
      } else {
        // User hasn't liked the photo, so add the like
        photo.likes.push(decoded.userId);
      }

      await photo.save();

      res.status(200).json({ message: 'Like updated successfully', likes: photo.likes });
    } catch (error) {
      console.error('Error updating like:', error);
      res.status(500).json({ error: 'Error updating like' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}