import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Login } from 'src/app/Models/login';
import { Response } from 'src/app/Models/response';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User } from '../Models/User';


@Injectable({
  providedIn: 'root'  
})
export class UsuarioServiceService {

 
  

  private usuarioSubject: BehaviorSubject<User>;

  public get userData():User{
    return this.usuarioSubject.value;
  }

  /* url:string= "https://localhost:7056/Usuario/LogIn";  */
  url:string= 'https://statsappapi.azurewebsites.net/Usuario/LogIn';

  constructor(private http:HttpClient){
    this.usuarioSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('usuLog')));
   }

  Login(login:Login):Observable<Response>{
    
    return this.http.post<Response>(this.url,login).pipe(
      map(res=>{
        if(res.exito===1){   
          const user:User = res.data;          
          localStorage.setItem('usuLog',JSON.stringify(user));
          this.usuarioSubject.next(user);
          localStorage.setItem('usu',user.userName);                   
        }
        return res;
      }));
  }

  LogOut(){
    localStorage.removeItem('usuLog');
    localStorage.removeItem('usu');
    this.usuarioSubject.next(null);
  }
}
