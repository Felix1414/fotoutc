
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import UserProfile from '@/components/UserProfile'
import { getUserById } from '@/lib/api'
import { notFound } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  // Otros campos de usuario
}

// Esta función obtiene los metadatos para la página
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const user = await getUserById(params.id)

  if (!user) {
    return {
      title: 'User Not Found',
      description: 'The requested user profile could not be found.',
    }
  }

  return {
    title: `${user.name}'s Profile | fotoUTC`,
    description: `View ${user.name}'s profile on fotoUTC`,
  }
}

// Esta función maneja la lógica para obtener el perfil del usuario
async function UserProfileContent({ userId }: { userId: string }) {
  let user: User | null = null

  try {
    user = await getUserById(userId)
  } catch (error) {
    console.error('Error fetching user:', error)
  }

  if (!user) {
    notFound() // Si no se encuentra el usuario, se redirige a la página 404
  }

  return <UserProfile user={user} /> // Aquí se pasa el objeto user completo al componente UserProfile
}

// Componente principal que se renderiza en la página
export default function UserProfilePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    }>
      <UserProfileContent userId={pa
