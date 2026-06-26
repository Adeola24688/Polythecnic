import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login'),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register'),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/portal-layout/portal-layout'),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard'),
      },
      {
        path: 'biodata',
        loadComponent: () => import('./features/biodata/biodata'),
      },
      {
        path: 'registration',
        loadComponent: () => import('./features/registration/registration'),
      },
      {
        path: 'result',
        loadComponent: () => import('./features/result/result'),
      },
      {
        path: 'clearance',
        loadComponent: () => import('./features/clearance/clearance'),
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/payment'),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings'),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
