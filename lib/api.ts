import axios from 'axios'

const normalizeApiMessage = (message: string): string => {
  const lower = message.toLowerCase()

  if (lower.includes('gemini api is disabled') || lower.includes('generative language api')) {
    return 'AI features are unavailable because the Gemini API is not enabled for the configured Google project.'
  }

  if (lower.includes('gemini_api_key is missing')) {
    return 'The backend is missing GEMINI_API_KEY.'
  }

  if (lower.includes('quota')) {
    return 'The AI provider quota has been exhausted. Please try again later.'
  }

  return message
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return normalizeApiMessage(data.message)
    }

    const status = error.response?.status
    if (status != null) {
      return `Request failed (${status})`
    }
  }

  if (error instanceof Error) return normalizeApiMessage(error.message)
  return 'Unknown error'
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message

    if (status == null || status >= 500) {
      console.error('[API Error]', message)
    }

    return Promise.reject(error)
  }
)

export default api
