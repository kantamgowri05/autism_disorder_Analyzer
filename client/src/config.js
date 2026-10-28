export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://autism-analyzer-api.onrender.com"
    : "http://127.0.0.1:8000");
