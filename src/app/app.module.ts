import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VivoComponent } from './vivo/vivo.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MenuComponent } from './menu/menu.component';
import { CrearEquipoComponent } from './Equipos/crear-equipo/crear-equipo.component';
import { VerEquiposComponent } from './Equipos/ver-equipos/ver-equipos.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CrearJugadoresComponent } from './Jugadores/crear-jugadores/crear-jugadores.component';
import { VerJugadoresComponent } from './Jugadores/ver-jugadores/ver-jugadores.component';
import { NuevoPartidoComponent } from './Dialogs/nuevo-partido/nuevo-partido.component';
import { CambiosComponent } from './Dialogs/cambios/cambios.component';
import { AnotarComponent } from './Dialogs/anotar/anotar.component';
import { DetalleJugadorComponent } from './Jugadores/detalle-jugador/detalle-jugador.component';
import { ConfirmarComponent } from './Dialogs/confirmar/confirmar.component';
import { EquipoDetalleComponent } from './Equipos/equipo-detalle/equipo-detalle.component';
import { PartidosComponent } from './partidos/partidos.component';
import { DetallePartidoComponent } from './partidos/detalle-partido/detalle-partido.component';
import { CrearEquipoRapidoComponent } from './Dialogs/crear-equipo-rapido/crear-equipo-rapido.component';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EditarRelojComponent } from './Dialogs/editar-reloj/editar-reloj.component';
import { EditarPuntajeComponent } from './Dialogs/editar-puntaje/editar-puntaje.component';
import { JwtInterceptor } from './Security/Jwt.interceptor';
import { LandingComponent } from './landing/landing.component';
import { MatPaginatorModule } from '@angular/material/paginator';




@NgModule({
  declarations: [
    AppComponent,    
    VivoComponent,
    LoginComponent,
    RegisterComponent,
    MenuComponent,
    CrearEquipoComponent,
    VerEquiposComponent,
    CrearJugadoresComponent,
    VerJugadoresComponent,    
    NuevoPartidoComponent,
    CambiosComponent,
    AnotarComponent,
    DetalleJugadorComponent,
    ConfirmarComponent,
    EquipoDetalleComponent,
    PartidosComponent,
    DetallePartidoComponent,
    CrearEquipoRapidoComponent,
    EditarRelojComponent,
    EditarPuntajeComponent,
    LandingComponent,    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    BrowserAnimationsModule,    
    MatPaginatorModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
