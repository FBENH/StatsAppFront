import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EquipoService } from './Services/equipo.service';
import { UsuarioServiceService } from './Services/usuario-service.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  public user = JSON.parse(localStorage.getItem('usuLog'));

  constructor(private equipoService:EquipoService,
    private userService: UsuarioServiceService){    
    this.equipoService.ListarEquipos(localStorage.getItem('usu'));  
         
  }

  title = 'stats-basket';
}
