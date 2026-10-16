import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  template: `
    <section class="contenedor portada">
      <h1>Estadísticas de básquet, anotadas durante el partido</h1>
      <p class="suave">
        Cargá tus equipos y jugadores, anotá cada jugada desde el celular mientras se juega
        y después mirá la planilla del partido y los promedios de cada jugador.
      </p>
      <div class="fila">
        <a class="boton primario" routerLink="/registro">Crear cuenta</a>
        <a class="boton" routerLink="/ingresar">Ya tengo cuenta</a>
      </div>
      <ul class="grilla puntos">
        <li class="tarjeta"><h3>Partido en vivo</h3><p class="suave">Tiros, rebotes, asistencias, robos, tapones, pérdidas y faltas por jugador, con reloj y cambios.</p></li>
        <li class="tarjeta"><h3>Minutos jugados</h3><p class="suave">Se cuentan solos según quién está en cancha mientras corre el reloj.</p></li>
        <li class="tarjeta"><h3>Promedios</h3><p class="suave">Porcentajes de tiro y promedios por partido de cada jugador y equipo.</p></li>
      </ul>
    </section>
  `,
  styles: `
    .portada { padding-top: 3rem; }
    h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); max-width: 18ch; }
    p { max-width: 60ch; font-size: 1.1rem; }
    .puntos { list-style: none; padding: 0; margin-top: 2.5rem; }
  `,
})
export default class Portada {}
