'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Mail, Edit2, Camera, Loader2, Save, X, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
  description: string;
  location: string;
  profilePicture: string;
}

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
}

interface Comment {
  id: string;
  photoId: string;
  text: string;
  createdAt: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setProfileError("No se encontró token de autenticación");
      setIsLoadingProfile(false);
      return;
    }

    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setName(userData.name);
        setDescription(userData.description);
        setLocation(userData.location);
        setProfilePicture(userData.profilePicture);
        fetchUserPhotos(token);
        fetchUserComments(token);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      setProfileError("No se pudo cargar el perfil del usuario");
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchUserPhotos = async (token: string) => {
    setIsLoadingPhotos(true);
    setPhotosError(null);
    try {
      const response = await fetch('fotoutc/pages/api/photos/[id]/comment.ts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const photos = await response.json();
        setUploadedPhotos(photos);
      } else {
        throw new Error('Failed to fetch user photos');
      }
    } catch (error) {
      setPhotosError("No se pudieron cargar las fotos del usuario");
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos del usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const fetchUserComments = async (token: string) => {
    setIsLoadingComments(true);
    setCommentsError(null);
    try {
      const response = await fetch('/api/user/comments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const comments = await response.json();
        setUserComments(comments);
      } else {
        throw new Error('Failed to fetch user comments');
      }
    } catch (error) {
      setCommentsError("No se pudieron cargar los comentarios del usuario");
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios del usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      toast({
        title: "Error",
        description: "No se encontró token de autenticación",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, location, profilePicture })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        toast({
          title: "Éxito",
          description: "Perfil actualizado correctamente",
        });
      } else {
        throw new Error('Failed to update user profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil del usuario",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfilePicture(data.url);
        toast({
          title: "Éxito",
          description: "Imagen de perfil subida correctamente",
        });
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen de perfil",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const detectLocation = () => {
    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            const detectedLocation = data.display_name || `${latitude}, ${longitude}`;
            setLocation(detectedLocation);
            setIsLoadingLocation(false);
            toast({
              title: "Ubicación detectada",
              description: "Se ha detectado y actualizado tu ubicación.",
            });
          } catch (error) {
            console.error("Error fetching location name:", error);
            setLocation(`${latitude}, ${longitude}`);
            setIsLoadingLocation(false);
            toast({
              title: "Error",
              description: "No se pudo obtener el nombre de la ubicación, se usarán las coordenadas.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
          toast({
            title: "Error",
            description: "No se pudo detectar tu ubicación. Por favor, ingrésala manualmente.",
            variant: "destructive",
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: "Error",
        description: "Tu navegador no soporta la geolocalización.",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleSaveComment = async (commentId: string) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      toast({
        title: "Error",
        description: "No se encontró token de autenticación",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: editedCommentText })
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setUserComments(userComments.map(comment => 
          comment.id === commentId ? { ...comment, text: updatedComment.text } : comment
        ));
        setEditingCommentId(null);
        toast({
          title: "Éxito",
          description: "Comentario actualizado correctamente",
        });
      } else {
        throw new Error('Failed to update comment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el comentario",
        variant: "destructive",
      });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{profileError}</AlertDescription>
        <Button onClick={fetchUserProfile} variant="outline" size="sm" className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudo cargar la información del usuario.</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto mt-8 p-6"
    >
      <Card className="w-full overflow-hidden">
        <CardHeader className="relative">
          <motion.div
            className="absolute top-4 right-4"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white bg-opacity-80 backdrop-blur-sm"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
              <AvatarImage src={profilePicture} alt={name} />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  <label htmlFor="profile-picture" className="cursor-pointer">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                      <Camera className="h-6 w-6" />
                    </div>
                    <input
                      id="profile-picture"
                      type="file"
                      className="hidden"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <CardTitle className="text-3xl font-bold text-center mt-4  bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="photos">Fotos</TabsTrigger>
              <TabsTrigger value="comments">Comentarios</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.form
                    key="edit-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
                      <Input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <Input
                          type="text"
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="flex-grow"
                        />
                        <Button
                          type="button"
                          onClick={detectLocation}
                          disabled={isLoadingLocation}
                          className="ml-2"
                        >
                          {isLoadingLocation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Detectar'
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        Guardar cambios
                      </Button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="user-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <motion.div
                      className="flex items-center space-x-2"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{user.email}</span>
                    </motion.div>
                    {description && (
                      <motion.p
                        className="text-gray-600"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {description}
                      </motion.p>
                    )}
                    {location && (
                      <motion.div
                        className="flex items-center space-x-2"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>{location}</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
            <TabsContent value="photos">
              {isLoadingPhotos ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : photosError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{photosError}</AlertDescription>
                  <Button onClick={() => fetchUserPhotos(localStorage.getItem('token') || '')} variant="outline" size="sm" className="mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Intentar de nuevo
                  </Button>
                </Alert>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedPhotos.map((photo) => (
                    <motion.div
                      key={photo._id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.description}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="comments">
              {isLoadingComments ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : commentsError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{commentsError}</AlertDescription>
                  <Button onClick={() => fetchUserComments(localStorage.getItem('token') || '')} variant="outline" size="sm" className="mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Intentar de nuevo
                  </Button>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {userComments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-secondary p-4 rounded-lg"
                    >
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editedCommentText}
                            onChange={(e) => setEditedCommentText(e.target.value)}
                            className="w-full"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCommentId(null)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveComment(comment.id)}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mb-2">{comment.text}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditComment(comment.id, comment.text)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
