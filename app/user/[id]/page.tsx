import { notFound } from 'next/navigation'
import UserProfile from '@/components/UserProfile'
import { getUserById } from '@/lib/api'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const user = await getUserById(params.id)

  if (!user) {
    notFound()
  }

  return <UserProfile userId={user.id} />
}