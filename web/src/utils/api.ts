import axios, { AxiosError } from 'axios';
import { getTelegramUserId } from './telegram';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд
});

api.interceptors.request.use((config) => {
  const userId = getTelegramUserId();
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Улучшенная обработка ошибок
    if (error.response) {
      // Сервер вернул ошибку
      const message = (error.response.data as any)?.message || 'Произошла ошибка на сервере';
      const status = error.response.status;
      
      // Можно добавить логирование или показ уведомлений
      console.error(`API Error [${status}]:`, message);
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('Network Error: Нет ответа от сервера');
    } else {
      // Ошибка при настройке запроса
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

