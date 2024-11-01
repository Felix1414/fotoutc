'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthModal } from "@/components/AuthModal";
import UserProfile from "@/components/UserProfile";
import { SharePhotoButton } from '@/components/SharePhotoButton';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, MapPin, Send, Camera, Sparkles, Share2, Facebook, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SpotifyNowPlaying from '@/api/spotify/now-playing';
import NewsSection from '@/components/NewsSection';

interface Comment {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  createdAt: string;
}

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  user: {
    id: string;
    name: string;
    profilePicture: string;
  };
  likes: string[];
  comments: Comment[];
}

export default function Home() {
  const { isLoggedIn, logout, user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [showProfile, setShowProfile] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPhotos();
    }

    window.addEventListener('photoUploaded', fetchPhotos);

    return () => {
      window.removeEventListener('photoUploaded', fetchPhotos);
    };
  }, [isLoggedIn]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      } else {
        throw new Error('Failed to fetch photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    setPhotos([]);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  const handleLike = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/like`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPhotos(photos.map(photo => 
          photo._id === photoId 
            ? { ...photo, likes: data.likes } 
            : photo
        ));
        toast({
          title: "Éxito",
          description: data.message,
        });
        if (data.likes.includes(user?.id)) {
          triggerConfetti();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating like');
      }
    } catch (error) {
      console.error('Error liking photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo dar like a la foto. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (photoId: string) => {
    if (!photoId) {
      console.error('Photo ID is undefined or empty');
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario. ID de foto inválido.",
        variant: "destructive",
      });
      return;
    }

    const commentText = newComments[photoId];
    if (!commentText) {
      console.log('Comment text is empty, not submitting');
      return;
    }

    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const newComment = {
          id: `temp-${Date.now()}`,
          text: commentText,
          user: {
            id: user?.id || '',
            name: user?.name || 'Usuario desconocido',
            profilePicture: user?.profilePicture || null,
          },
          createdAt: new Date().toISOString(),
        };

        setPhotos(photos.map(photo =>
          photo._id === photoId
            ? {
              ...photo,
              comments: [
                ...photo.comments,
                newComment,
              ],
            }
          : photo
        ));
        setNewComments({ ...newComments, [photoId]: '' });
        toast({
          title: "Éxito",
          description: data.message || "Comentario añadido con éxito",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error adding comment');
      }
    } catch (error) {
      console.error('Error commenting on photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo agregar el comentario. Intenta de nuevo.',
        variant: "destructive",
      });
    }
  };

  const triggerConfetti = () => {
    if (confettiRef.current) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#22c55e', '#16a34a'],
      });
    }
  };

  const handleShare = (photoId: string, platform: 'facebook' | 'whatsapp') => {
    const photoUrl = `${window.location.origin}/photo/${photoId}`;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(photoUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Mira esta foto en FotoUTC! ${photoUrl}`)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full min-h-screen bg-cover bg-center bg-fixed" style={{backgroundImage: "url('https://64.media.tumblr.com/bb7556c810e4adadbbcbc78458da4924/tumblr_mob6dn7Clj1r3ahrlo6_500.gif')"}}>
      <div className="w-full min-h-screen bg-black bg-opacity-50">
        <header className="sticky top-0 z-10 flex justify-between items-center p-6 bg-cover bg-center" style={{backgroundImage: "url('https://64.media.tumblr.com/196e5caf117c379ca8b4138f5061a9f2/tumblr_oz3l83lbxW1vghtqoo2_1280.gifv')"}}>
          <div className="w-full h-full absolute top-0 left-0 bg-black bg-opacity-50"></div>
          <h1 className="text-4xl font-bold font-montserrat tracking-tight z-10">
            <span className="text-white group-hover:text-green-200 transition-colors duration-300">
              fotoUTC
            </span>
          </h1>
          {isLoggedIn && (
            <div className="z-10 flex-grow mx-4">
              <SpotifyNowPlaying />
            </div>
          )}
          {isLoggedIn ? (
            <div className="flex items-center space-x-4 z-10">
              <Button onClick={() => setShowProfile(!showProfile)} variant="outline" className="bg-white text-green-700 hover:bg-green-100 font-semibold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105">
                {showProfile ? 'Ver fotos' : 'Ver perfil'}
              </Button>
              <Button onClick={handleLogout} variant="outline" className="bg-white text-green-700 hover:bg-green-100 font-semibold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105">
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <div className="z-10">
              <AuthModal />
            </div>
          )}
        </header>
        <main className="p-6">
          {isLoggedIn ? (
            showProfile ? (
              <UserProfile />
            ) : (
              <div className="container mx-auto px-4 py-8">
                <AnimatePresence>
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {photos.map((photo) => (
                      <motion.div
                        key={photo._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white bg-opacity-90">
                          <CardHeader className="p-4">
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarImage src={photo.user.profilePicture} alt={photo.user.name} />
                                <AvatarFallback>{photo.user.name ? photo.user.name[0] : 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-sm font-semibold">{photo.user.name || 'Usuario desconocido'}</h3>
                                {photo.location && (
                                  <p className="text-xs text-gray-500 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {photo.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0 relative">
                            <img src={photo.imageUrl} alt={photo.description} className="w-full h-64 object-cover" />
                            <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md">
                              <Camera className="h-5 w-5 text-green-500" />
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 flex flex-col">
                            <div className="flex justify-between items-center w-full mb-2">
                              <div className="flex space-x-4">
                                <Button variant="ghost" size="sm" onClick={() => handleLike(photo._id)}>
                                  <Heart className={`h-5 w-5 mr-1 ${photo.likes.includes(user?.id || '') ? 'fill-red-500 text-red-500' : ''}`} />
                                  {photo.likes.length}
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MessageCircle className="h-5 w-5 mr-1" />
                                  {photo.comments.length}
                                </Button>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Share2 className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleShare(photo._id, 'facebook')}>
                                    <Facebook className="mr-2 h-4 w-4" />
                                    <span>Compartir en Facebook</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShare(photo._id, 'whatsapp')}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    <span>Compartir en WhatsApp</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {photo.description && (
                              <p className="text-sm text-gray-600 mb-2">{photo.description}</p>
                            )}
                            <div className="w-full">
                              {photo.comments.slice(0, 3).map((comment) => (
                                <div key={comment.id} className="flex items-start space-x-2 mb-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={comment.user?.profilePicture || undefined} alt={comment.user?.name || 'Usuario'} />
                                    <AvatarFallback>{comment.user?.name?.[0] || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm">
                                      <span className="font-semibold">{comment.user?.name || 'Usuario desconocido'}</span> {comment.text}
                                    </p>
                                    <p className="text-xs  text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                              
                              {photo.comments.length > 3 && (
                                <Button variant="link" size="sm" className="p-0 text-green-600 hover:text-green-700">
                                  Ver todos los {photo.comments.length} comentarios
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center mt-2 w-full">
                              <Input
                                type="text"
                                placeholder="Añade un comentario..."
                                value={newComments[photo._id] || ''}
                                onChange={(e) => 
                                  setNewComments({ ...newComments, [photo._id]: e.target.value })
                                }
                                className="flex-grow border-green-300 focus:ring-green-500 focus:border-green-500"
                              />
                              <Button variant="ghost" size="sm" onClick={() => handleComment(photo._id)}>
                                <Send className="h-5 w-5 text-green-500" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-8">
                  <NewsSection />
                </div>
                <div className="mt-8 flex justify-center">
                  <SharePhotoButton />
                </div>
              </div>
            )
          ) : (
            <div className="text-center mt-10">
              <p className="text-xl mb-4 text-white">Por favor, inicia sesión para ver y compartir fotos.</p>
              <Sparkles className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
            </div>
          )}
        </main>
        <div ref={confettiRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-50" />
      </div>
    </div>
  );
}