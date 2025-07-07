// Configuration des URLs selon l'environnement
const getApiBaseUrl = (): string => {
  // En production ou quand on utilise le proxy nginx, utiliser des URLs relatives
  if (process.env.NODE_ENV === 'production' || !process.env.REACT_APP_API_BASE_URL) {
    return '';
  }
  return process.env.REACT_APP_API_BASE_URL;
};

const getWebSocketBaseUrl = (): string => {
  // En production ou quand on utilise le proxy nginx
  if (process.env.NODE_ENV === 'production' || !process.env.REACT_APP_WS_BASE_URL) {
    // Déterminer le protocole WebSocket selon le protocole de la page
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  return process.env.REACT_APP_WS_BASE_URL;
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
  wsBaseUrl: getWebSocketBaseUrl(),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default config;