import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParamsOptions } from '@angular/common/http';
import { Equipo } from '../Models/equipo';
import { Observable, catchError, map } from 'rxjs';
import { Response } from '../Models/response';
import { EquipoRapido } from '../Models/EquipoRapido';

@Injectable({
  providedIn: 'root'
})
export class EquipoService {

  
  apiUrl:string= "";

  constructor(private http:HttpClient) { }

  CrearEquipo(equipo:Equipo):Observable<Response>{    
    return this.http.post<Response>(this.apiUrl+"Crear",equipo).pipe(
      map(res=>{        
        return res;
      }), catchError(error=>{
        console.error('Error en la solicitud:', error);
      throw error;
      }));
  }
  CrearEquipoRapido(equipo:EquipoRapido):Observable<Response>{
    return this.http.post<Response>(this.apiUrl+"CrearEquipoRapido",equipo).pipe(
      map(res=>{
        return res;
      })
    );
  }
  ListarEquipos(idUsuario:string):Observable<Response>{
    return this.http.get<Response>(this.apiUrl+"Listar",{params:{idUsuario:idUsuario}}).pipe(
      map(res=>{   
        localStorage.setItem('equipos',JSON.stringify(res.data));     
        return res;        
      })
    );
  }
  ListarPorId(id:number):Observable<Response>{
    return this.http.get<Response>(this.apiUrl+"ListarPorId",{params:{idEquipo: id}}).pipe(map(res=>{
      return res;
    }));
  }

  Eliminar(id:number):Observable<Response>{
    return this.http.delete<Response>(this.apiUrl+"Eliminar",{params:{id:id}}).pipe(map(res=>{
      return res
    }));
  }

  Modificar(equipo:Equipo):Observable<Response>{
    return this.http.put<Response>(this.apiUrl+"Modificar",equipo).pipe(map(res=>{
      return res;
    }));
  }
}
