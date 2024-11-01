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
      const { text } = req.body;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid photo ID' });
      }

      const decodedId = decodeURIComponent(id);

      if (!ObjectId.isValid(decodedId)) {
        return res.status(400).json({ message: 'Invalid photo ID format' });
      }

      if  (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
      }

      const photo = await Photo.findById(decodedId);

      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      photo.comments.push({
        user: decoded.userId,
        text: text,
        createdAt: new Date()
      });

      await photo.save();

      res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Error adding comment' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}