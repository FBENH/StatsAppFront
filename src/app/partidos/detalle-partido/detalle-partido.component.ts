import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { PartidoService } from 'src/app/Services/partido.service';
import { PromediosService } from 'src/app/Services/promedios.service';

@Component({
  selector: 'app-detalle-partido',
  templateUrl: './detalle-partido.component.html',
  styleUrls: ['./detalle-partido.component.scss']
})
export class DetallePartidoComponent implements OnInit {

  id:number;
  visitanteId:number;
  localId:number;
  partidoCompleto:any;
  estadisticaLocal:any;
  estadisticaVisitante:any;
  estadisticaJLocal:any[]=[];
  estadisticaJVisitante:any[]=[];

  constructor(private route:ActivatedRoute,
    private partidoService:PartidoService,
    private promedioService:PromediosService){}

 async ngOnInit() {
    await this.route.paramMap.subscribe(async params=> {
      this.id = +params.get('id');
      this.visitanteId= +params.get('idVisitante');
      this.localId= +params.get('idLocal');      
      const partidoCompleto = await lastValueFrom(this.partidoService.ListarConStats(this.id));           
      if(partidoCompleto.data){
        this.partidoCompleto= partidoCompleto.data;        
        this.estadisticaLocal= partidoCompleto.data.statPartido.filter(e=> e.equipoId===this.localId);
        this.estadisticaVisitante= partidoCompleto.data.statPartido.filter(e=> e.equipoId===this.visitanteId);        
        partidoCompleto.data.jugadores.forEach(j=>{
        if(j.estadisticasJugador[0].equipoId === this.localId)
          this.estadisticaJLocal.push(j);
        if(j.estadisticasJugador[0].equipoId === this.visitanteId)
          this.estadisticaJVisitante.push(j);
        });                             
      }            
    });
  }

  PorcentajeTC(estadistica: any):number { 
    return this.promedioService.PorcentajeTC(estadistica);
  }
  PorcentajesTiros(estadistica:any, tipo:string):number{
    return this.promedioService.PorcentajesTiros(estadistica,tipo);
  }
  Promediar(estadistica:string, objeto:any):number{
    return this.promedioService.Promediar(estadistica,objeto);
  }
  formatTimeToMinutes(timeStr: string): string {    
    return this.promedioService.formatTimeToMinutes(timeStr);
  }
}
