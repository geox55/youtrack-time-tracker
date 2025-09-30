import axios from 'axios'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
}

export const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders
  },
  timeout: 10000,
  withCredentials: true
})
