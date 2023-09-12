import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { Jugador } from '../Models/jugador';
import { Response } from '../Models/response';


@Injectable({
  providedIn: 'root'
})
export class JugadorService {

  

  constructor(private http:HttpClient) { }

  url:string= "https://statsappapi.azurewebsites.net/Jugadores/";

  CrearJugador(jugador:Jugador):Observable<Response>{
    return this.http.post<Response>(this.url+"Crear",jugador).pipe(map(res=>{
      return res;
    }),
    catchError(error=>{
      console.error("Error en la solicitud",error);
      throw error;
    }));
  }

  ListarPorId(idJugador:number):Observable<Response>{
    return this.http.get<Response>(this.url+"ListarPorId",{params:{id:idJugador}}).pipe(map(res=>{
      return res;
    }));
  }

  ListarJugadores(idUsuario:string){
    return this.http.get<Response>(this.url+"Listar",{params:{idUsuario: idUsuario}}).pipe(map(res=>{
      localStorage.setItem('Jugadores',JSON.stringify(res.data));      
      return res
    }));
  }

  ListarJugadoresPorEquipo(id:number):Observable<Response>{
    return this.http.get<Response>(this.url+"ListarPorEquipo",{params:{ equipoId: id.toString() }}).pipe(map(res=>{            
      return res;
    }));
  }

  Eliminar(idJugador:number):Observable<Response>{
    return this.http.delete<Response>(this.url+"Eliminar",{params:{id: idJugador}}).pipe(map(res=>{
      return res;
    }));
  }

  ModificarJugador(jugador:Jugador):Observable<Response>{
    return this.http.put<Response>(this.url+"Modificar",jugador).pipe(map(res=>{
      return res;
    }),
    catchError(error=>{
      console.error("Error en la solicitud",error);
      throw error;
    }));
  }

}
