import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import { registerUser, loginUser } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    const { action, email, password } = req.body;

    try {
      if (action === 'register') {
        const { user, token } = await registerUser(email, password);
        res.status(201).json({ message: 'Usuario registrado exitosamente', token });
      } else if (action === 'login') {
        const { user, token } = await loginUser(email, password);
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
      } else {
        res.status(400).json({ message: 'Acción no válida' });
      }
    } catch (error) {
      console.error('Error en la autenticación:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Ocurrió un error inesperado' });
      }
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}