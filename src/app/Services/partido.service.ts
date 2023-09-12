import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CrearPartido } from '../Models/Crearpartido';
import { Observable, catchError, map } from 'rxjs';
import { Response } from '../Models/response';

@Injectable({
  providedIn: 'root'
})
export class PartidoService {

  constructor(private http:HttpClient) { }

  url:string= "https://statsappapi.azurewebsites.net/Partido/";

  CrearPartido(partido:CrearPartido):Observable<Response>{
    return this.http.post<Response>(this.url+"Crear",partido).pipe(map(res=>{
      return res
    }),
    catchError(error=>{
      console.error("Error en la solicitud",error);
      throw error;
    }));    
  }

  ListarPorId(id:number):Observable<Response>{
    return this.http.get<Response>(this.url+"ListarPorId",{params:{idPartido:id}}).pipe(map(res=>{
      return res;
    }));
  }

  ListarTodos(idUsuario:string):Observable<Response>{
    return this.http.get<Response>(this.url+"ListarTodos",{params:{idUsuario:idUsuario}}).pipe(map(res=>{
      localStorage.setItem('partidos',JSON.stringify(res.data));
      return res;
    }));    
  }

  ListarConStats(id:number):Observable<Response>{
    return this.http.get<Response>(this.url+"ConStats",{params:{id: id}}).pipe(map(res=>{      
      return res
    }));
  }
}
