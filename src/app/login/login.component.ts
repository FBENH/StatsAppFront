import { Component } from '@angular/core';
import { Login } from '../Models/login';
import { UsuarioServiceService } from 'src/app/Services/usuario-service.service';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  error:String= "";

  constructor(private usuServ:UsuarioServiceService,
              private router: Router){
    if(localStorage.getItem('usuLog')!==null){
      this.router.navigate(["/menu"]);
    }
  }
  login: Login = new Login();

  LogIn(){
    this.usuServ.Login(this.login).subscribe(
      (response) => {
        if(response.exito===1){
        this.router.navigate(["/menu"]);
      }
      else{
        this.error= "Usuario o contraseña incorrectos.";
      }
      }); 
  }

  Alert(){
    alert("Deshabilitado temporalmente.");
  }
}
