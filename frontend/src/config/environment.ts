// Configuration des URLs selon l'environnement
const getApiBaseUrl = (): string => {
  // En production, utiliser l'URL du backend déployé sur Railway
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || '';
  }
  // En développement, utiliser l'URL locale ou celle définie dans .env
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
};

const getWebSocketBaseUrl = (): string => {
  // En production, utiliser l'URL WebSocket du backend déployé
  if (process.env.NODE_ENV === 'production') {
    const apiUrl = process.env.REACT_APP_API_BASE_URL || '';
    if (apiUrl) {
      return apiUrl.replace(/^https?:/, apiUrl.startsWith('https:') ? 'wss:' : 'ws:');
    }
    return '';
  }
  // En développement
  return process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8080';
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
  wsBaseUrl: getWebSocketBaseUrl(),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default config;