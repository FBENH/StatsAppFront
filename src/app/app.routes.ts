import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { Auth, authGuard } from './core/auth';

const soloSinSesion = () => !inject(Auth).logueado() || inject(Router).createUrlTree(['/inicio']);

export const routes: Routes = [
  { path: '', loadComponent: () => import('./paginas/portada'), canActivate: [soloSinSesion], title: 'StatsApp' },
  { path: 'ingresar', loadComponent: () => import('./paginas/ingresar'), canActivate: [soloSinSesion], title: 'Ingresar · StatsApp' },
  { path: 'registro', loadComponent: () => import('./paginas/registro'), canActivate: [soloSinSesion], title: 'Crear cuenta · StatsApp' },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'inicio', loadComponent: () => import('./paginas/inicio'), title: 'Inicio · StatsApp' },
      { path: 'equipos', loadComponent: () => import('./paginas/equipos/equipos'), title: 'Equipos · StatsApp' },
      { path: 'equipos/nuevo', loadComponent: () => import('./paginas/equipos/equipo-form'), title: 'Nuevo equipo · StatsApp' },
      { path: 'equipos/:id', loadComponent: () => import('./paginas/equipos/equipo'), title: 'Equipo · StatsApp' },
      { path: 'jugadores', loadComponent: () => import('./paginas/jugadores/jugadores'), title: 'Jugadores · StatsApp' },
      { path: 'jugadores/nuevo', loadComponent: () => import('./paginas/jugadores/jugador-form'), title: 'Nuevo jugador · StatsApp' },
      { path: 'jugadores/:id', loadComponent: () => import('./paginas/jugadores/jugador'), title: 'Jugador · StatsApp' },
      { path: 'partidos', loadComponent: () => import('./paginas/partidos/partidos'), title: 'Partidos · StatsApp' },
      { path: 'partidos/nuevo', loadComponent: () => import('./paginas/partidos/nuevo-partido'), title: 'Nuevo partido · StatsApp' },
      { path: 'partidos/en-vivo', loadComponent: () => import('./paginas/partidos/en-vivo'), title: 'En vivo · StatsApp' },
      { path: 'partidos/:id', loadComponent: () => import('./paginas/partidos/partido'), title: 'Partido · StatsApp' },
    ],
  },
  { path: '**', redirectTo: '' },
];
