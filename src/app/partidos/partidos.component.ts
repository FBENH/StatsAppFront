import { Component, OnInit } from '@angular/core';
import { PartidoService } from '../Services/partido.service';
import { Router } from '@angular/router';
import { EquipoService } from '../Services/equipo.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-partidos',
  templateUrl: './partidos.component.html',
  styleUrls: ['./partidos.component.scss']
})
export class PartidosComponent implements OnInit {

  partidos:any[];
  partidosFiltrados:any[];
  equipoFiltro:string=null;  
  busqueda:string='';
  equipos:any[];
  fechaInicial:string;
  fechaFinal:string;
  
  

  constructor(private partidoService:PartidoService,
    private router:Router,
    private equipoService:EquipoService){
    
  }

  async ngOnInit(){
    const partidosData = JSON.parse(localStorage.getItem('partidos'));

    if(partidosData){      
      this.partidos = partidosData;
      this.partidosFiltrados = partidosData;
      this.updatePage();      
    }
    else{
      await this.partidoService.ListarTodos(localStorage.getItem('usu')).subscribe(res=>{
        if(res.data)
        this.partidos = res.data;
        this.partidosFiltrados= res.data;
        this.updatePage();          
      });
    }    
    const equipoData = JSON.parse(localStorage.getItem('equipos'));
    if(equipoData){
      this.equipos = equipoData;
    }
    else{
      await this.equipoService.ListarEquipos(localStorage.getItem('usu')).subscribe(res=>{
        if(res.data)
        this.equipos = res.data;
      });
    }    
  }

  FormatoFecha(date:string){
    if(date === null){
      return null;
    }
    
    const _date = new Date(date);

    const dia= _date.getDate();
    const mes= _date.getMonth() + 1;
    const año= _date.getFullYear();

    return `${dia}/${mes}/${año}`
  }

  VerDetalles(id:number,idLocal:number,idVisitante:number){
    this.router.navigate(['/partido',id,idVisitante,idLocal]);
  }
  verificarFiltro() {
    
    if (this.fechaInicial && this.fechaFinal) {
      this.Filtrar(this.busqueda); 
    }
  }

  currentPage = 0;
  paginatedPartidos: any[] = [];
  handlePageEvent(pageEvent: PageEvent){
    this.currentPage = pageEvent.pageIndex;
    this.updatePage(); 
    window.scrollTo(0,0);
  }
  updatePage() {
    const startIndex = this.currentPage * 12;
    const endIndex = startIndex + 12;
    this.paginatedPartidos = this.partidosFiltrados.slice(startIndex, endIndex);
  }

  Filtrar(busqueda:string){
    let partidosFiltrados = this.partidos.filter(p =>
      p.local.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.visitante.toLowerCase().includes(busqueda.toLowerCase())
    );
    
    if(this.equipoFiltro){      
      partidosFiltrados= partidosFiltrados.filter(p=>
        p.local === this.equipoFiltro ||
        p.visitante === this.equipoFiltro);         
    }

    if(this.fechaInicial && this.fechaFinal){      
      const fechaInicial = new Date(this.fechaInicial);
      const fechaFinal = new Date(this.fechaFinal);

      fechaInicial.setHours(0,0,0,0);
      fechaFinal.setHours(23,59,59,999);

      partidosFiltrados = partidosFiltrados.filter(p => {
        if (p.fecha !== null) {
          const fechaP = new Date(p.fecha).setHours(0, 0, 0, 0);
          return fechaP.valueOf() >= fechaInicial.valueOf() &&
            fechaP.valueOf() <= fechaFinal.valueOf() + 1;
        }
        // Si p.fecha es null, no se incluirá en el resultado
        return false;
      });        
    }    
    this.partidosFiltrados = partidosFiltrados;
    this.currentPage=0;
    this.updatePage();
}
}
