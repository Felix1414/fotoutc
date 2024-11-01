'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pause, Play } from 'lucide-react'

interface SpotifyTrack {
  name: string
  artist: string
  album: string
  albumArt: string
  previewUrl: string
}

export default function SpotifyNowPlaying() {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchCurrentTrack = async () => {
      try {
        const response = await fetch('/api/spotify/now-playing', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setCurrentTrack(data)
        }
      } catch (error) {
        console.error('Error fetching current track:', error)
      }
    }

    fetchCurrentTrack()
    const interval = setInterval(fetchCurrentTrack, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (currentTrack && currentTrack.previewUrl) {
      setAudio(new Audio(currentTrack.previewUrl))
    }
  }, [currentTrack])

  const togglePlay = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  if (!currentTrack) {
    return null
  }

  return (
    <Card className="bg-black bg-opacity-50 text-white">
      <CardContent className="p-2 flex items-center space-x-2">
        <img src={currentTrack.albumArt} alt={currentTrack.album} className="w-10 h-10 rounded-md" />
        <div className="flex-grow overflow-hidden">
          <p className="font-semibold text-sm truncate">{currentTrack.name}</p>
          <p className="text-xs text-gray-300 truncate">{currentTrack.artist}</p>
        </div>
        {currentTrack.previewUrl && (
          <Button 
            onClick={togglePlay} 
            size="sm" 
            variant="ghost" 
            className="text-white hover:text-green-400"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}