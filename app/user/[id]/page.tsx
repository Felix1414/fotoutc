import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import UserProfile from '@/components/UserProfile'
import { getUserById } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  // Add other user properties as needed
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

async function UserProfileContent({ userId }: { userId: string }) {
  let user: User | null = null

  try {
    user = await getUserById(userId)
  } catch (error) {
    console.error('Error fetching user:', error)
  }

  if (!user) {
    notFound()
  }

  return <UserProfile userId={user.id} />
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    }>
      <UserProfileContent userId={params.id} />
    </Suspense>
  )
}
