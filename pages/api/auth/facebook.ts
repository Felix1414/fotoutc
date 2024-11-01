import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { User } from '../../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const { accessToken } = req.body;

  try {
    console.log("Recibida solicitud de autenticación de Facebook");
    // Verificar el token de acceso de Facebook
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) {
      console.error("Error en la respuesta de Facebook:", data.error);
      throw new Error(data.error.message);
    }

    console.log("Datos recibidos de Facebook:", data);

    // Buscar o crear el usuario
    let user = await User.findOne({ email: data.email });

    if (!user) {
      console.log("Creando nuevo usuario");
      user = new User({
        email: data.email,
        name: data.name,
        facebookId: data.id,
      });
      await user.save();
    } else if (!user.facebookId) {
      console.log("Actualizando usuario existente con ID de Facebook");
      user.facebookId = data.id;
      await user.save();
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    console.log("Autenticación exitosa, enviando token");
    res.status(200).json({ token });
  } catch (error) {
    console.error('Facebook authentication error:', error);
    res.status(500).json({ message: 'Error en la autenticación con Facebook' });
  }
}