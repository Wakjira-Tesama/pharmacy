import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For physical devices or Android emulator, you might need to change 'localhost' 
// to your computer's local IP address (e.g., 'http://192.168.1.5:5000/api')
// For iOS simulator and web browser, localhost works fine.
const BASE_URL = 'https://pharmacy-api-29ih.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Add a request interceptor to attach the JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
