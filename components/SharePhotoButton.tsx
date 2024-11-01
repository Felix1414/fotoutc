"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Upload, X, Camera, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SharePhotoButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const detectLocation = () => {
    setIsDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            const detectedLocation = data.display_name || `${latitude}, ${longitude}`;
            setLocation(detectedLocation);
            setIsDetectingLocation(false);
            toast({
              title: "Ubicación detectada",
              description: "Se ha detectado y añadido tu ubicación.",
            });
          } catch (error) {
            console.error("Error fetching location name:", error);
            setLocation(`${latitude}, ${longitude}`);
            setIsDetectingLocation(false);
            toast({
              title: "Ubicación detectada",
              description: "Se han añadido las coordenadas de tu ubicación.",
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsDetectingLocation(false);
          toast({
            title: "Error",
            description: "No se pudo detectar tu ubicación. Por favor, ingrésala manualmente.",
            variant: "destructive",
          });
        }
      );
    } else {
      setIsDetectingLocation(false);
      toast({
        title: "Error",
        description: "Tu navegador no soporta la geolocalización.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una imagen para compartir.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('location', location);

    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Tu foto ha sido compartida correctamente.",
        });
        setIsOpen(false);
        setFile(null);
        setPreview(null);
        setDescription('');
        setLocation('');
        // Dispatch a custom event to trigger a refresh of the photos
        window.dispatchEvent(new CustomEvent('photoUploaded'));
      } else {
        throw new Error('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "No se pudo compartir la foto. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 transform hover:scale-110">
          <Upload className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white bg-opacity-80 backdrop-blur-md rounded-lg shadow-xl border border-green-200">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">Compartir una foto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photo" className="text-sm font-medium text-gray-700">Foto</Label>
            <motion.div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-green-300 border-dashed rounded-md bg-white bg-opacity-50 transition-all duration-300 ease-in-out hover:border-emerald-400 hover:bg-green-50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="space-y-1 text-center">
                {preview ? (
                  <div className="relative w-full h-48">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    <Button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mx-auto h-12 w-12 text-green-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="photo"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span>Subir una foto</span>
                        <Input
                          id="photo"
                          name="photo"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB</p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe tu foto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white bg-opacity-50"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">Ubicación</Label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <Input
                type="text"
                name="location"
                id="location"
                className="flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 focus:ring-green-500 focus:border-green-500 bg-white bg-opacity-50"
                placeholder="Añade una ubicación"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Button
                type="button"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <MapPin className="h-5 w-5" aria-hidden="true" />
                <AnimatePresence>
                  {isDetectingLocation ? (
                    <motion.span
                      key="detecting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Detectando...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="detect"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Detectar
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:shadow-lg"
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Compartiendo...
                </div>
              ) : (
                'Compartir foto'
              )}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}