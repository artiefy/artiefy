import { NextResponse } from 'next/server';
import axios from 'axios';

const VIDEO_TO_TEXT_API = 'http://3.145.183.203:8000/video2text';
const DEFAULT_TIMEOUT = 300000;

interface TranscriptionItem {
  start: number;
  end: number;
  text: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let url = body.url;

    if (!url) {
      return NextResponse.json(
        { error: 'URL del video es requerida' },
        { status: 400 }
      );
    }

    // Ensure URL is properly formatted
    if (!url.startsWith('http')) {
      url = `https://s3.us-east-2.amazonaws.com/artiefy-upload/${url}`;
    }

    console.log('Procesando solicitud para URL:', url);

    // Make request to external API with JSON data
    const response = await axios.post(
      VIDEO_TO_TEXT_API,
      { url }, // Send as JSON object
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: DEFAULT_TIMEOUT,
        validateStatus: (status) => status === 200,
      }
    );

    // Log response for debugging
    console.log('Respuesta del API:', {
      status: response.status,
      data: response.data,
    });

    // Validate response data
    if (!Array.isArray(response.data)) {
      console.error('Formato de respuesta inválido:', response.data);
      return NextResponse.json(
        { error: 'Formato de respuesta inválido del servicio' },
        { status: 502 }
      );
    }

    // Return transcription data
    return NextResponse.json({ transcription: response.data });

  } catch (error) {
    console.error('Error detallado:', error);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json(
          { error: 'Tiempo de espera agotado' },
          { status: 504 }
        );
      }

      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 
        error.response?.data?.message || 
        error.message;

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
