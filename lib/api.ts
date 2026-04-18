import axios from 'axios'

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
