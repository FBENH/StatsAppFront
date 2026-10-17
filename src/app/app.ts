import { HttpClient, HttpContext } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { url } from './core/api';
import { Auth } from './core/auth';
import { BaseDormida, SIN_AVISO } from './core/base-dormida';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(Auth);
  protected readonly base = inject(BaseDormida);
  protected readonly menuAbierto = signal(false);
  /** El widget va dentro de un iframe en otro sitio: sin la barra de la app. */
  protected readonly esWidget = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.startsWith('/widget/')),
    ),
    { initialValue: location.pathname.startsWith('/widget/') },
  );

  constructor() {
    // Si la base está pausada, empieza a despertar mientras la persona mira la portada o escribe su usuario.
    inject(HttpClient)
      .get(url('/salud/base'), {
        context: new HttpContext().set(SIN_AVISO, true),
        responseType: 'text',
      })
      .subscribe({ error: () => {} });
  }
}
