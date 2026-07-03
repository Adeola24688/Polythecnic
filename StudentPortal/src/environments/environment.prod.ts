const origin =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://student-portal-api-y3dn.onrender.com';

export const environment = {
  production: true,
  apiBaseUrl: `${origin}/api`,
  baseUrl: origin,
};
