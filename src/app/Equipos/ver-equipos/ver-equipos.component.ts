import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Equipo } from 'src/app/Models/equipo';
import { EquipoService } from 'src/app/Services/equipo.service';


@Component({
  selector: 'app-ver-equipos',
  templateUrl: './ver-equipos.component.html',
  styleUrls: ['./ver-equipos.component.scss']
})
export class VerEquiposComponent {

  ciudadFiltro:string=null;
  busqueda:string='';


  equipos: any[];
  equiposFiltrados:any[];
  constructor(private equipoService:EquipoService,
    private router:Router){}

  ngOnInit(){
    if(localStorage.getItem('equipos')===null){
      this.equipoService.ListarEquipos(localStorage.getItem('usu')).subscribe(res=>{
        this.equipos= res.data; 
        this.equiposFiltrados= res.data;  
        this.updatePage();           
      });
    }
    else{
      this.equipos= JSON.parse(localStorage.getItem('equipos'));
      this.equiposFiltrados= this.equipos;  
      this.updatePage();     
    }    
  }

  currentPage = 0;
  paginatedEquipos: any[] = [];
  handlePageEvent(pageEvent: PageEvent){
    this.currentPage = pageEvent.pageIndex;
    this.updatePage(); 
    window.scrollTo(0,0);
  }
  updatePage() {
    const startIndex = this.currentPage * 12;
    const endIndex = startIndex + 12;
    this.paginatedEquipos = this.equiposFiltrados.slice(startIndex, endIndex);
  }

  Filtrar(busqueda:string){
    let equiposFiltrados = this.equipos.filter(e =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||      
      e.ciudad?.toLowerCase().includes(busqueda.toLowerCase()) 
    );
  
    if(this.ciudadFiltro){      
      equiposFiltrados= equiposFiltrados.filter(e=>
        e.ciudad === this.ciudadFiltro);         
    }
       
    this.equiposFiltrados= equiposFiltrados;
    this.currentPage=0;
    this.updatePage();
  }

  VerDetalles(id:number){
    this.router.navigate(['equipo',id]);
  }
}
