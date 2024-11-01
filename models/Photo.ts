// models/Photo.ts
import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PhotoSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
}, { timestamps: true });

export const Photo = mongoose.models.Photo || mongoose.model('Photo', PhotoSchema);