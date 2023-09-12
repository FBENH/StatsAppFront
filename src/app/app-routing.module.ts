import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MenuComponent } from './menu/menu.component';
import { CrearEquipoComponent } from './Equipos/crear-equipo/crear-equipo.component';
import { VerEquiposComponent } from './Equipos/ver-equipos/ver-equipos.component';
import { CrearJugadoresComponent } from './Jugadores/crear-jugadores/crear-jugadores.component';
import { VerJugadoresComponent } from './Jugadores/ver-jugadores/ver-jugadores.component';
import { VivoComponent } from './vivo/vivo.component';
import { DetalleJugadorComponent } from './Jugadores/detalle-jugador/detalle-jugador.component';
import { EquipoDetalleComponent } from './Equipos/equipo-detalle/equipo-detalle.component';
import { PartidosComponent } from './partidos/partidos.component';
import { DetallePartidoComponent } from './partidos/detalle-partido/detalle-partido.component';
import { AuthGuard } from './Security/AuthGuard';
import { LandingComponent } from './landing/landing.component';


const routes: Routes = [
  /* {path:'', redirectTo:'menu', pathMatch:'full'}, */ 
  {path:'', component:LandingComponent},  
  {path:'login',component: LoginComponent},  
  {path: 'menu', component: MenuComponent, canActivate: [AuthGuard]},
  {path: 'crearEquipo', component: CrearEquipoComponent, canActivate: [AuthGuard]},
  {path: 'Equipos', component: VerEquiposComponent, canActivate: [AuthGuard]},
  {path:'crearJugador',component:CrearJugadoresComponent, canActivate: [AuthGuard]},
  {path:'Jugadores',component:VerJugadoresComponent, canActivate: [AuthGuard]},
  {path:'vivo',component:VivoComponent, canActivate: [AuthGuard]},
  {path:'jugador/:id',component: DetalleJugadorComponent, canActivate: [AuthGuard]},
  {path:'equipo/:id',component: EquipoDetalleComponent, canActivate: [AuthGuard]},
  {path:'partidos',component: PartidosComponent, canActivate: [AuthGuard]},
  {path:'partido/:id/:idLocal/:idVisitante',component: DetallePartidoComponent, canActivate: [AuthGuard]}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
