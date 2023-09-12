import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Equipo } from 'src/app/Models/equipo';
import { EquipoService } from 'src/app/Services/equipo.service';
import { JugadorService } from 'src/app/Services/jugador.service';

@Component({
  selector: 'app-ver-jugadores',
  templateUrl: './ver-jugadores.component.html',
  styleUrls: ['./ver-jugadores.component.scss']
})
export class VerJugadoresComponent {  
  jugadores: any[];
  equipos: any[];
  jugadoresFiltro:any[];

  equipoFiltro:number=null;

  toggle:boolean= false;
  busqueda:string="";

  constructor(private jugadorService:JugadorService,
              private equipoService:EquipoService,
              private router:Router){
    if(localStorage.getItem('Jugadores')===null){          
        jugadorService.ListarJugadores(localStorage.getItem('usu')).subscribe(res=>{
          if(res.data){
            this.jugadores= res.data;
            this.jugadoresFiltro= res.data;           
            this.updatePage();           
          }                   
        });             
    }
    else{      
      this.jugadores = JSON.parse(localStorage.getItem('Jugadores')); 
      this.jugadoresFiltro = JSON.parse(localStorage.getItem('Jugadores')); 
      this.updatePage();      
    }
    if(localStorage.getItem('equipos')===null){
      equipoService.ListarEquipos(localStorage.getItem('usu')).subscribe(res=>{
        if(res.data){
          this.equipos= res.data;
        }        
      });        
    }
    else{
      this.equipos= JSON.parse(localStorage.getItem('equipos'));      
    }    
  }

  currentPage = 0;
  paginatedJugadores: any[] = [];
  handlePageEvent(pageEvent: PageEvent){
    this.currentPage = pageEvent.pageIndex;
    this.updatePage(); 
    window.scrollTo(0,0);
  }
  updatePage() {
    const startIndex = this.currentPage * 12;
    const endIndex = startIndex + 12;
    this.paginatedJugadores = this.jugadoresFiltro.slice(startIndex, endIndex);
  }

  Filtrar(busqueda:string){
    let jugadoresFiltrados = this.jugadores.filter(j =>
      j.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  
    
    if (this.equipoFiltro !== null) {
      if(this.equipoFiltro===-1){
        jugadoresFiltrados= jugadoresFiltrados.filter(j=>
          j.equipoId === null);
      }
      else{
        jugadoresFiltrados = jugadoresFiltrados.filter(j =>
          j.equipoId === this.equipoFiltro
        );
      }        
    }    
    this.jugadoresFiltro = jugadoresFiltrados;
    this.currentPage=0;
    this.updatePage();
  }


  
  VerDetalles(id:number){
    this.router.navigate(['jugador',id]);
  }
}
