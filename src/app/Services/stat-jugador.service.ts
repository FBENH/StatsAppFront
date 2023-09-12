import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Response } from '../Models/response';

@Injectable({
  providedIn: 'root'
})
export class StatJugadorService {

  url:string= ""

  constructor(private http:HttpClient) { }

  ListarPorJugador(idJugador:number):Observable<Response>{
    return this.http.get<Response>(this.url+"ListarPorJugador",{params:{idJugador: idJugador}}).
    pipe(map(res=>{
      return res;
    }));
  }

  ListarTodas(idUsuario:string):Observable<Response>{
    return this.http.get<Response>(this.url+"ListarTodas", {params:{idUsuario: idUsuario}}).pipe
    (map(res=>{      
      localStorage.setItem('estadisticasJugador', JSON.stringify(res.data));
      return res;
    }));
  }

}
