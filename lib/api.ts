import { MongoClient, ObjectId } from 'mongodb';

// Asegúrate de que esta URI coincida con tu variable de entorno MONGODB_URI
const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri);

export async function getUserById(userId: string) {
  try {
    await client.connect();
    const database = client.db('fotoUTC'); // Reemplaza 'fotoUTC' con el nombre de tu base de datos
    const users = database.collection('users');

    const user = await users.findOne({ _id: new ObjectId(userId) });
    return user;
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Exporta otras funciones que puedas necesitar
export async function updateUser(userId: string, updateData: any) {
  try {
    await client.connect();
    const database = client.db('fotoUTC');
    const users = database.collection('users');

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    return result;
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw error;
  } finally {
    await client.close();
  }
}
