import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <script 
          async 
          defer 
          crossOrigin="anonymous" 
          src="https://connect.facebook.net/en_US/sdk.js"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.fbAsyncInit = function() {
              FB.init({
                appId: '1719776805445392',
                cookie: true,
                xfbml: true,
                version: 'v12.0'
              });
            };
          `
        }} />
      </body>
    </html>
  )
}