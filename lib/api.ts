import axios from 'axios'

/** Lit le message renvoyé par l'API (body JSON) quand Axios signale une 4xx/5xx. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message
    }
    const status = error.response?.status
    if (status != null) {
      return `Request failed (${status})`
    }
  }
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 secondes (Gemini peut prendre du temps)
})

// Interceptor pour logger les erreurs en dev
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data?.message || error.message)
    return Promise.reject(error)
  }
)

export default api
