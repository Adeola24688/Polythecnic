const origin =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://your-render-backend.onrender.com';

export const environment = {
  production: true,
  apiBaseUrl: `${origin}/api`,
  baseUrl: origin,
};
