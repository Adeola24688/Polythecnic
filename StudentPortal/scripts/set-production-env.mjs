import { writeFileSync } from 'node:fs';

const rawApiBaseUrl = process.env.PUBLIC_API_BASE_URL?.trim() || 'https://your-render-backend.onrender.com/api';
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

const rawBaseUrl = process.env.PUBLIC_BASE_URL?.trim() || apiBaseUrl.replace(/\/api$/, '');
const baseUrl = rawBaseUrl.replace(/\/+$/, '');

const content = `export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl}',
  baseUrl: '${baseUrl}',
};
`;

writeFileSync(new URL('../src/environments/environment.prod.ts', import.meta.url), content);
console.log(`Generated production environment with apiBaseUrl=${apiBaseUrl}`);
