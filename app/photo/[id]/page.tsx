"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, MapPin } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  comments: Array<{
    id: string;
    text: string;
    user: {
      id: string;
      name: string;
      profilePicture: string;
    };
    createdAt: string;
  }>;
}

export default function PhotoPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPhoto = async () => {
      if (!id) return;
      try {
        const response = await fetch(`/api/photos/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPhoto(data);
        } else {
          console.error('Failed to fetch photo');
          toast({
            title: "Error",
            description: "No se pudo cargar la foto. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching photo:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar la foto.",
          variant: "destructive",
        });
      }
    };

    fetchPhoto();
  }, [id, toast]);

  const handleLike = async () => {
    if (!photo || !user) return;
    try {
      const response = await fetch(`/api/photos/${photo._id}/like`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPhoto(prevPhoto => prevPhoto ? { ...prevPhoto, likes: data.likes } : null);
        toast({
          title: "Éxito",
          description: data.message,
        });
      } else {
        throw new Error('Error updating like');
      }
    } catch (error) {
      console.error('Error liking photo:', error);
      toast({
        title: "Error",
        description: "No se pudo dar like a la foto. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!photo || !newComment.trim() || !user) return;
    try {
      const response = await fetch(`/api/photos/${photo._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setPhoto(prevPhoto => prevPhoto ? {
          ...prevPhoto,
          comments: [...prevPhoto.comments, data.comment],
        } : null);
        setNewComment('');
        toast({
          title: "Éxito",
          description: "Comentario añadido correctamente.",
        });
      } else {
        throw new Error('Error adding comment');
      }
    } catch (error) {
      console.error('Error commenting on photo:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (!photo) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={photo.user.profilePicture} alt={photo.user.name} />
              <AvatarFallback>{photo.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-semibold">{photo.user.name}</h3>
              {photo.location && (
                <p className="text-xs text-gray-500 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {photo.location}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Image
            src={photo.imageUrl}
            alt={photo.description}
            width={800}
            height={600}
            layout="responsive"
            objectFit="cover"
          />
        </CardContent>
        <CardFooter className="flex flex-col p-4">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" onClick={handleLike}>
                <Heart className={`h-5 w-5 mr-1 ${photo.likes.includes(user?.id || '') ? 'fill-red-500 text-red-500' : ''}`} />
                {photo.likes.length}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5 mr-1" />
                {photo.comments.length}
              </Button>
            </div>
          </div>
          {photo.description && (
            <p className="text-sm text-gray-600 mb-4">{photo.description}</p>
          )}
          <div className="w-full mb-4">
            {photo.comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2 mb-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={comment.user.profilePicture} alt={comment.user.name} />
                  <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{comment.user.name}</span> {comment.text}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center w-full">
            <Input
              type="text"
              placeholder="Añade un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-grow mr-2"
            />
            <Button variant="ghost" size="sm" onClick={handleComment}>
              <Send className="h-5 w-5 text-green-500" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}