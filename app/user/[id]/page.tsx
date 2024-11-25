import { Metadata } from 'next'
import { useEffect, useState } from 'react'
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

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUserById(params.id)
        if (!fetchedUser) {
          notFound() // Si no se encuentra el usuario, redirige a la página 404
        } else {
          setUser(fetchedUser)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center">
        <p>User not found</p>
      </div>
    )
  }

  return <UserProfile user={user} />
}
