import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { esperaDe, esReintentable } from './base-dormida';

describe('base dormida', () => {
  it('reintenta lecturas y el ingreso, no otras escrituras', () => {
    expect(esReintentable('GET', 'https://api/Equipo/Listar')).toBe(true);
    expect(esReintentable('POST', 'https://api/Usuario/LogIn')).toBe(true);
    expect(esReintentable('POST', 'https://api/Partido/Jugadas')).toBe(false);
    expect(esReintentable('DELETE', 'https://api/Liga/Eliminar')).toBe(false);
  });

  it('espera lo que dice Retry-After, con un tope', () => {
    const con = (valor?: string) =>
      new HttpErrorResponse({
        status: 503,
        headers: valor ? new HttpHeaders({ 'Retry-After': valor }) : undefined,
      });
    expect(esperaDe(con('10'))).toBe(10000);
    expect(esperaDe(con('600'))).toBe(30000);
    expect(esperaDe(con())).toBe(5000);
  });
});
