import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JugadorService } from '../Services/jugador.service';
import { EstadisticaJugador } from '../Models/estadisticaJugador';
import { Estadistica } from '../Models/estadistica';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CambiosComponent } from '../Dialogs/cambios/cambios.component';
import { AnotarComponent } from '../Dialogs/anotar/anotar.component';
import { CompartirService } from '../Services/compartir.service';
import { CrearPartido } from '../Models/Crearpartido';
import { Partido } from '../Models/partido';
import { PartidoService } from '../Services/partido.service';
import { statJ } from '../Models/statJ';
import { StatP } from '../Models/statP';
import { EditarRelojComponent } from '../Dialogs/editar-reloj/editar-reloj.component';
import { EditarPuntajeComponent } from '../Dialogs/editar-puntaje/editar-puntaje.component';
import { ConfirmarComponent } from '../Dialogs/confirmar/confirmar.component';
import { lastValueFrom } from 'rxjs';


@Component({
  selector: 'app-vivo',
  templateUrl: './vivo.component.html',
  styleUrls: ['./vivo.component.scss']
})
export class VivoComponent {  

  

  constructor(private route:ActivatedRoute,
              private jugadorService:JugadorService,
              private dialog:MatDialog,
              private data:CompartirService,
              private partidoService: PartidoService,
              private router:Router){
                
              }

  local?:any;
  visitante?:any;
  fecha:Date;
  lugar:string;
  jugadoresLocal:any[];
  jugadoresVisitante:any[];
  titularesLocal:any[]=[];
  titularesVisitante:any[]=[];

  estadisticaJugador: EstadisticaJugador[]=[];
  estadisticaPartido: Estadistica[]=[];

  indexL?:number= this.estadisticaPartido.findIndex(e=> e.EquipoId === this.local.id);
  indexV?:number= this.estadisticaPartido.findIndex(e=> e.EquipoId === this.visitante.id);

  jugadorSelec:any;
  equipoSelec:any;
  

   async ngOnInit(){  
    let _openDialog = true;  
      await this.data.dataL$.subscribe(data=>{    
        if(typeof data === 'string'){
            this.local= JSON.parse(data);  
            if(this.local){
            const nuevaEstadistica= new Estadistica();
            nuevaEstadistica.EquipoId= this.local.id;
            this.estadisticaPartido.push(nuevaEstadistica);
            localStorage.setItem('local',JSON.stringify(this.local));
            }               
        }
        else{          
          this.router.navigate(['/menu']);
          _openDialog= false;
          return
        }
        
       });
       await this.data.dataV$.subscribe(data=>{
        if(typeof data === 'string'){
          this.visitante=JSON.parse(data);
          if(this.visitante){
            const nuevaEstadistica= new Estadistica();
            nuevaEstadistica.EquipoId= this.visitante.id;
            this.estadisticaPartido.push(nuevaEstadistica);
            localStorage.setItem('visitante',JSON.stringify(this.visitante));
          }             
        }
        else{          
          this.router.navigate(['/menu']);
          _openDialog = false;
          return
        }    
       });
    
       await this.data.dataF$.subscribe(data=>{
        if(data){
          this.fecha = data;      
        }
       });
    
       await this.data.dataLug$.subscribe(data=>{
        if(data){
          this.lugar = data;      
        }
       });
    
      try {
        if(this.local){      
          const localJugadoresResponse = await lastValueFrom(this.jugadorService.ListarJugadoresPorEquipo(this.local.id));
          this.jugadoresLocal = localJugadoresResponse.data;
          if(this.jugadoresLocal.length===0){
            alert("El equipo "+ this.local.nombre+ " no tiene jugadores. No se puede iniciar");
            this.router.navigate(["/menu"]);
            return;
          }
    
          this.jugadoresLocal.forEach(j=>{
            const nuevaEstadistica= new EstadisticaJugador();
            nuevaEstadistica.JugadorId= j.id;
            nuevaEstadistica.EquipoId= j.equipoId;
            this.estadisticaJugador.push(nuevaEstadistica);
          });          
        }     
        if(this.visitante){
          const visitanteJugadoresResponse = await lastValueFrom(this.jugadorService.ListarJugadoresPorEquipo(this.visitante.id));
          this.jugadoresVisitante = visitanteJugadoresResponse.data;
          if(this.jugadoresVisitante.length===0){
            alert("El equipo "+ this.visitante.nombre+ " no tiene jugadores. No se puede iniciar");
            this.router.navigate(["/menu"]);
            return;
          }
          this.jugadoresVisitante.forEach(j=>{
            const nuevaEstadistica= new EstadisticaJugador();
            nuevaEstadistica.JugadorId= j.id;
            nuevaEstadistica.EquipoId= j.equipoId;
            this.estadisticaJugador.push(nuevaEstadistica);
          });
        }   
    
      } catch (error) {
        console.error('Error al obtener los jugadores:', error);
      }
      if(_openDialog){
        await this.openDialog();
      }  
  }

openDialog():void{
  const dialogRef = this.dialog.open(CambiosComponent,{
    maxWidth:'600px',
    data: {jugadoresLocal:JSON.stringify(this.jugadoresLocal) , jugadoresVisitante:JSON.stringify(this.jugadoresVisitante),
    titularesLocal: JSON.stringify(this.titularesLocal), titularesVisitante: JSON.stringify(this.titularesVisitante)}
  });
  dialogRef.afterClosed().subscribe(res=>{
    if(res){
      if(res.titularesLocal){
        this.titularesLocal= JSON.parse(res.titularesLocal);        
        localStorage.setItem('titularesLocal',JSON.stringify(this.titularesLocal));    
      }
      if(res.titularesVisitante){
        this.titularesVisitante= JSON.parse(res.titularesVisitante);        
        localStorage.setItem('titularesVisitante',JSON.stringify(this.titularesVisitante));
      }   
    }     
  });
}

anotarDialog():MatDialogRef<AnotarComponent>{
  const dialogRef = this.dialog.open(AnotarComponent,{
    width:'250px',
    data: {local: JSON.stringify(this.local), visitante: JSON.stringify(this.visitante),
          titularesLocal:JSON.stringify(this.titularesLocal), titularesVisitante: JSON.stringify(this.titularesVisitante)}
  });
  dialogRef.afterClosed().subscribe(res=>{
    this.jugadorSelec= null;
    this.equipoSelec= null;
    if(res){
      if(res.equipo){
        this.equipoSelec= JSON.parse(res.equipo);
      }
      if(res.jugador){
        this.jugadorSelec= JSON.parse(res.jugador);
      }
    }
  });
  return dialogRef;
}

EditarReloj(){      
  const dialogRef = this.dialog.open(EditarRelojComponent,{    
    width:'300px',
    data: this.tiempoRestante
  });
  dialogRef.afterClosed().subscribe(res=>{
    if(res){      
      this.tiempoTotal = res.tiempo;
      this.tiempoRestante = res.tiempo;      
    }    
  });
}
EditarPuntaje(local:boolean){
  if(local){
    const dialogRef = this.dialog.open(EditarPuntajeComponent,{
      width:'150px',
      data: {puntos: this.buscarStat(this.local.id).Puntos || 0, local:true}
    });
    dialogRef.afterClosed().subscribe(res=>{
      this.buscarStat(this.local.id).Puntos = res
    });
  }
  else{
    const dialogRef = this.dialog.open(EditarPuntajeComponent,{
      width:'150px',
      data: {puntos: this.buscarStat(this.visitante.id).Puntos || 0, local: false}
    });
    dialogRef.afterClosed().subscribe(res=>{
      this.buscarStat(this.visitante.id).Puntos = res
    });
  }  
}

async ejecutar(accion:string,func: (accion:string)=>void) {
  this.anotarDialog().afterClosed().subscribe(res => {
    this.jugadorSelec = null;
    this.equipoSelec = null;
    if (res) {
      if (res.equipo) {
        this.equipoSelec = JSON.parse(res.equipo);
      }
      if (res.jugador) {
        this.jugadorSelec = JSON.parse(res.jugador);
      }
      func(accion);         
    }     
  });  
}

 async make(accion:string){
  if(this.equipoSelec && this.jugadorSelec){
    localStorage.setItem('respaldoJ',JSON.stringify(this.estadisticaJugador));
    localStorage.setItem('respaldoP',JSON.stringify(this.estadisticaPartido));   
    const indiceExistente= this.estadisticaJugador.findIndex(e=> e.JugadorId===this.jugadorSelec.id);
    const indiceExistenteP= this.estadisticaPartido.findIndex(e=> e.EquipoId === this.equipoSelec.id);      
    if(indiceExistente !== -1 && indiceExistenteP!==-1){
      switch(accion){
        case '2':        
        this.estadisticaJugador[indiceExistente].Aciertos2Puntos+=1;
        this.estadisticaJugador[indiceExistente].Intentos2Puntos+=1;
        this.estadisticaJugador[indiceExistente].Puntos+=2;        
        this.estadisticaPartido[indiceExistenteP].Aciertos2Puntos+=1;
        this.estadisticaPartido[indiceExistenteP].Intentos2Puntos+=1;
        this.estadisticaPartido[indiceExistenteP].Puntos+=2;        
        break;
        case '2m': this.estadisticaJugador[indiceExistente].Intentos2Puntos+=1;
        this.estadisticaPartido[indiceExistenteP].Intentos2Puntos+=1;
        break;
        case '3':this.estadisticaJugador[indiceExistente].Aciertos3Puntos+=1;
        this.estadisticaJugador[indiceExistente].Intentos3Puntos+=1;
        this.estadisticaJugador[indiceExistente].Puntos+=3;
        this.estadisticaPartido[indiceExistenteP].Aciertos3Puntos+=1;
        this.estadisticaPartido[indiceExistenteP].Intentos3Puntos+=1;
        this.estadisticaPartido[indiceExistenteP].Puntos+=3;
        break;
        case '3m': this.estadisticaJugador[indiceExistente].Intentos3Puntos+=1;
        this.estadisticaPartido[indiceExistenteP].Intentos3Puntos+=1;
        break;
        case '1':this.estadisticaJugador[indiceExistente].Aciertos1Punto+=1;
        this.estadisticaJugador[indiceExistente].Intentos1Punto+=1;
        this.estadisticaJugador[indiceExistente].Puntos+=1;
        this.estadisticaPartido[indiceExistenteP].Aciertos1Punto+=1;
        this.estadisticaPartido[indiceExistenteP].Intentos1Punto+=1;
        this.estadisticaPartido[indiceExistenteP].Puntos+=1;
        break;
        case '1m': this.estadisticaJugador[indiceExistente].Intentos1Punto+=1;
        this.estadisticaPartido[indiceExistenteP].Intentos1Punto+=1;
        break;
        case 'def':this.estadisticaJugador[indiceExistente].RebotesDefensivos+=1;
        this.estadisticaJugador[indiceExistente].Rebotes+=1;
        this.estadisticaPartido[indiceExistenteP].RebotesDefensivos+=1;
        this.estadisticaPartido[indiceExistenteP].Rebotes+=1;      
        break;
        case 'ofe':this.estadisticaJugador[indiceExistente].RebotesOfensivos+=1;
        this.estadisticaJugador[indiceExistente].Rebotes+=1; 
        this.estadisticaPartido[indiceExistenteP].RebotesOfensivos+=1;  
        this.estadisticaPartido[indiceExistenteP].Rebotes+=1;       
        break;
        case 'per':this.estadisticaJugador[indiceExistente].Perdidas+=1;  
        this.estadisticaPartido[indiceExistenteP].Perdidas+=1;               
        break;
        case 'rob':this.estadisticaJugador[indiceExistente].Robos+=1; 
        this.estadisticaPartido[indiceExistenteP].Robos+=1;                
        break;
        case 'tap':this.estadisticaJugador[indiceExistente].Tapones+=1;  
        this.estadisticaPartido[indiceExistenteP].Tapones+=1;               
        break;
        case 'foul': this.estadisticaJugador[indiceExistente].Faltas+=1;
        this.estadisticaPartido[indiceExistenteP].Faltas+=1; 
        break;
        case 'asi': this.estadisticaJugador[indiceExistente].Asistencias+=1;
        this.estadisticaPartido[indiceExistenteP].Asistencias+=1;
      }            
    }    
  }
}

Volver(){
  const estadisticaJugador= JSON.parse(localStorage.getItem('respaldoJ'));
  const estadisticaPartido= JSON.parse(localStorage.getItem('respaldoP'));
  if(estadisticaJugador){
    this.estadisticaJugador= estadisticaJugador;
  }  
  if(estadisticaPartido){
    this.estadisticaPartido= estadisticaPartido;
  }  
}

buscarStat(equipoId:number){
  return this.estadisticaPartido.find(e=> e.EquipoId === equipoId);
}

tiempoTotal: number = 600000; // 10 minutos en milisegundos
acumulado:number=0;
tiempoRestante: number = this.tiempoTotal;
running: boolean = false;
interval: any;

 

startStopReloj() {   
  this.acumulado= this.tiempoTotal- this.tiempoRestante;   
  this.estadisticaJugador.forEach(e=>{
    if(this.titularesLocal.find(t=> t.id === e.JugadorId) || this.titularesVisitante.find(t=>t.id===e.JugadorId) ){
      e.Minutos+=this.acumulado;      
    }
  });
  this.acumulado=0;
  this.tiempoTotal = this.tiempoRestante;
  if (this.running) {
    clearInterval(this.interval);
  } else {
    this.interval = setInterval(() => {
      this.actualizarTiempo();
    }, 10);
  }
  this.running = !this.running;
}

resetReloj() {
  clearInterval(this.interval);
  this.running = false;
  this.tiempoRestante = this.tiempoTotal;  
}

actualizarTiempo() {  
  if (this.running) {
    this.tiempoRestante -= 10; // Resta 10 milisegundos
    if (this.tiempoRestante <= 0) {
      this.tiempoRestante = 0;
      this.running = false;
      clearInterval(this.interval);              
    }
  }
}

obtenerTiempoFormateado() {
  const minutos = Math.floor(this.tiempoRestante / 60000);
  const segundos = Math.floor((this.tiempoRestante % 60000) / 1000);
  const milisegundos = this.tiempoRestante % 1000;
  return `${minutos}:${segundos.toString().padStart(2, '0')}:${milisegundos.toString().padStart(2, '0')}`;
}
async finalizarPartido(){
  const dialogRef = this.dialog.open(ConfirmarComponent,{
    width:'300px',
    data:'Finalizar'
  });
  await dialogRef.afterClosed().subscribe(res=>{
    if(res){
      const nuevoPartido= new CrearPartido();
  const partido= new Partido();
  const _statJ:statJ[]=[];
  const _statP:StatP[]=[];
  partido.equipoLocal= this.local.id;
  partido.equipoVisitante= this.visitante.id;
  partido.fecha = this.fecha;
  partido.lugar = this.lugar;
  const indexL= this.estadisticaPartido.findIndex(e=> e.EquipoId === this.local.id);
  const indexV= this.estadisticaPartido.findIndex(e=> e.EquipoId === this.visitante.id);
  if(this.estadisticaPartido[indexL].Puntos>this.estadisticaPartido[indexV].Puntos){
    partido.ganador= this.local.id;
  }
  else if(this.estadisticaPartido[indexL].Puntos<this.estadisticaPartido[indexV].Puntos){
    partido.ganador= this.visitante.id;
  }
  partido.idUsuario= localStorage.getItem('usu');
  this.estadisticaJugador.forEach(e=>{
    const _stat = new statJ();
    _stat.aciertos1Punto= e.Aciertos1Punto;
    _stat.aciertos2Puntos= e.Aciertos2Puntos;
    _stat.aciertos3Puntos= e.Aciertos3Puntos;
    _stat.asistencias= e.Asistencias;
    _stat.faltas= e.Faltas;
    _stat.intentos1Punto= e.Intentos1Punto;
    _stat.intentos2Puntos= e.Intentos2Puntos;
    _stat.intentos3Puntos= e.Intentos3Puntos;
    _stat.jugadorId= e.JugadorId;
    _stat.minutos= e.Minutos;
    _stat.puntos= e.Puntos;
    _stat.rebotes=e.Rebotes;
    _stat.rebotesDefensivos= e.RebotesDefensivos;
    _stat.rebotesOfensivos= e.RebotesOfensivos;
    _stat.robos= e.Robos;
    _stat.tapones= e.Tapones;
    _stat.perdidas= e.Perdidas;
    _stat.equipoId = e.EquipoId;
    _statJ.push(_stat);
  });
  this.estadisticaPartido.forEach(e=>{
    const _stat = new StatP();
    _stat.equipoId= e.EquipoId;    
    _stat.aciertos1Punto= e.Aciertos1Punto;
    _stat.aciertos2Puntos= e.Aciertos2Puntos;
    _stat.aciertos3Puntos= e.Aciertos3Puntos;
    _stat.asistencias= e.Asistencias;
    _stat.faltas= e.Faltas;
    _stat.intentos1Punto= e.Intentos1Punto;
    _stat.intentos2Puntos= e.Intentos2Puntos;
    _stat.intentos3Puntos= e.Intentos3Puntos;    
    _stat.puntos= e.Puntos;
    _stat.rebotes=e.Rebotes;
    _stat.rebotesDefensivos= e.RebotesDefensivos;
    _stat.rebotesOfensivos= e.RebotesOfensivos;
    _stat.robos= e.Robos;
    _stat.tapones= e.Tapones;
    _stat.perdidas = e.Perdidas;    
    _statP.push(_stat);
  });
  nuevoPartido.statJ= _statJ;
  nuevoPartido.statP= _statP;
  nuevoPartido.partido= partido;  
  this.partidoService.CrearPartido(nuevoPartido).subscribe(res=>{
    if(res.exito===1){
      alert("Se creó el partido.");
      this.router.navigate(['/partido',res.data,this.local.id,this.visitante.id]);
    }   
  });
  }});  
}
Salir(){
  const dialogRef = this.dialog.open(ConfirmarComponent,{
    width:"250px",
    data: "Salir"
  });
  dialogRef.afterClosed().subscribe(res=>{
    if(res)
    this.router.navigate(['/menu']);
  });
}
}
