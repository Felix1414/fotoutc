'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Newspaper, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: {
    name: string
  }
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/news')
        
        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status}`)
        }

        const data = await response.json()

        if (data.status === "error") {
          throw new Error(`Error de News API: ${data.message}`)
        }

        if (!data.articles || !Array.isArray(data.articles)) {
          throw new Error('Formato de datos inválido')
        }

        setNews(data.articles)
      } catch (error) {
        console.error('Error en fetchNews:', error)
        setError(error instanceof Error ? error.message : 'Error al cargar las noticias')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('es-ES', options)
  }

  return (
    <Card className="w-full bg-white bg-opacity-90">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Newspaper className="mr-2" />
          Noticias Destacadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando noticias...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && news.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay noticias disponibles en este momento.
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && news.length > 0 && (
          <div className="space-y-6">
            {news.map((article, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <h3 className="font-semibold text-lg">{article.title || 'Sin título'}</h3>
                <p className="text-sm text-gray-600 mt-1">{article.description || 'Sin descripción'}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {article.source.name} - {formatDate(article.publishedAt)}
                  </span>
                  <Button 
                    variant="link" 
                    className="p-0 text-green-600 hover:text-green-700"
                    onClick={() => article.url && window.open(article.url, '_blank')}
                  >
                    Leer más
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}