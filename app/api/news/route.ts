import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key no configurada' }, 
      { status: 500 }
    )
  }

  try {
    const url = `https://newsapi.org/v2/top-headlines?country=mx&apiKey=${apiKey}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`News API respondió con estado: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === "error") {
      throw new Error(`Error de News API: ${data.message}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener las noticias' }, 
      { status: 500 }
    )
  }
}