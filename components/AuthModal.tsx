"use client";

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Facebook } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import emailjs from '@emailjs/browser'

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isFBSDKLoaded, setIsFBSDKLoaded] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()

  useEffect(() => {
    const checkFBSDK = setInterval(() => {
      if (window.FB) {
        setIsFBSDKLoaded(true);
        clearInterval(checkFBSDK);
      }
    }, 100);

    return () => clearInterval(checkFBSDK);
  }, []);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    console.log('EmailJS Public Key:', publicKey);
    if (publicKey) {
      emailjs.init(publicKey);
    } else {
      console.error('EmailJS Public Key is not defined');
    }
  }, []);

  const handleAuth = async (action: 'login' | 'register') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, password }),
      })
      const data = await response.json()
      if (response.ok) {
        if (action === 'register') {
          toast({
            title: "Registro exitoso",
            description: "Su cuenta ha sido creada. Ahora puede iniciar sesión.",
          })
          setIsRegistering(false)
          await sendWelcomeEmail(email)
        } else {
          if (rememberMe) {
            localStorage.setItem('token', data.token)
          } else {
            sessionStorage.setItem('token', data.token)
          }
          login(data.token)
          setIsOpen(false)
          toast({
            title: "Inicio de sesión exitoso",
            description: data.message,
          })
        }
      } else {
        throw new Error(data.message || 'Ha ocurrido un error')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Ha ocurrido un error desconocido',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendWelcomeEmail = async (email: string) => {
    console.log('Attempting to send welcome email to:', email);
    console.log('Using service ID:', process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID);
    console.log('Using template ID:', process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID);

    try {
      const result = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to_name: email.split('@')[0],
          to_email: email,
        }
      );

      console.log('EmailJS send result:', result);

      if (result.status === 200) {
        setIsEmailSent(true);
        toast({
          title: "Correo de bienvenida enviado",
          description: `Se ha enviado un correo de bienvenida a ${email}.`,
        });
      } else {
        throw new Error(`Failed to send email. Status: ${result.status}`);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el correo de bienvenida. Por favor, inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    }
  };

  const handleFacebookLogin = () => {
    if (!isFBSDKLoaded) {
      toast({
        title: "Error",
        description: 'El SDK de Facebook no está cargado correctamente',
        variant: "destructive",
      });
      return;
    }

    window.FB.login(async function(response: any) {
      if (response.authResponse) {
        try {
          const res = await fetch('/api/auth/facebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: response.authResponse.accessToken }),
          });
          const data = await res.json();
          if (res.ok) {
            login(data.token);
            setIsOpen(false);
            toast({
              title: "Inicio de sesión exitoso",
              description: "Has iniciado sesión con Facebook",
            });
          } else {
            throw new Error(data.message);
          }
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : 'Error al iniciar sesión con Facebook',
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: 'Inicio de sesión con Facebook cancelado',
          variant: "destructive",
        });
      }
    }, {scope: 'public_profile,email'});
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-green-700 hover:bg-green-100 font-semibold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105">
          Acceder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">{isRegistering ? "Registrarse" : "Acceder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleAuth(isRegistering ? 'register' : 'login'); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="Ingrese su correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {!isRegistering && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Recordarme
              </label>
            </div>
          )}
          <Button
            type="submit"
            className={`w-full bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105`}
            disabled={isLoading}
          >
            {isLoading ? 'Cargando...' : isRegistering ? 'Registrarse' : 'Iniciar sesión'}
          </Button>
        </form>
        <div className="mt-4">
          <Button
            onClick={handleFacebookLogin}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            disabled={!isFBSDKLoaded}
          >
            <Facebook className="mr-2" />
            Iniciar sesión con Facebook
          </Button>
        </div>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-green-600 hover:underline"
          >
            {isRegistering ? "¿Ya tienes una cuenta? Inicia sesión" : "¿No tienes una cuenta? Regístrate"}
          </Button>
        </div>
        {isEmailSent && (
          <p className="text-green-500 mt-2">
            ¡Te hemos enviado un correo de bienvenida! Revisa tu bandeja de entrada.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}