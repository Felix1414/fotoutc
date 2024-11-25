import { User } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

export async function registerUser(email: string, password: string) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('El usuario ya existe');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword });
  await user.save();

  // Aquí, pasamos directamente JWT_SECRET como string
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Contraseña incorrecta');
  }

  // Aquí también, pasamos directamente JWT_SECRET como string
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
}
