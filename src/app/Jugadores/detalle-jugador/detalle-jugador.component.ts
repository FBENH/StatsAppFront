import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom, timeout } from 'rxjs';
import { EquipoService } from 'src/app/Services/equipo.service';
import { ImagenService } from 'src/app/Services/imagen.service';
import { JugadorService } from 'src/app/Services/jugador.service';
import { PartidoService } from 'src/app/Services/partido.service';
import { Response } from 'src/app/Models/response';
import { Jugador } from 'src/app/Models/jugador';
import { MatDialog} from '@angular/material/dialog';
import { ConfirmarComponent } from 'src/app/Dialogs/confirmar/confirmar.component';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-detalle-jugador',
  templateUrl: './detalle-jugador.component.html',
  styleUrls: ['./detalle-jugador.component.scss']
})
export class DetalleJugadorComponent implements OnInit {
  @ViewChild('seleccion')
  seleccion : ElementRef;
  imagenUrl:string;
  imgMensaje:string;
  mensaje:string;
  
  id:number;
  jugador:any;    
  verMas:boolean= false;
  mod:boolean=false;
  partidos:any[];  
  equipos:any[];
  imageSrc: string;
  _file: File;

  jugadorForm = this.fb.group({
    nombre: ['', [Validators.required,Validators.maxLength(30),Validators.pattern(/^\S.*$/)]],
    numero: ['', [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern('^[0-9]+$')]],
    posicion: [''],
    altura: ['', [Validators.min(0),Validators.max(500)]],
    peso:['',[Validators.min(0),Validators.max(500)]],
    equipoSelec:[''],
    equipoNombre:['']      
  });
  

  constructor(private jugadorService: JugadorService,
              private route:ActivatedRoute,              
              private partidoService:PartidoService,
              private equipoService:EquipoService,              
              private fb:FormBuilder,
              private imgService: ImagenService,
              public dialog:MatDialog,
              private router:Router){}
async ngOnInit(){  
  await this.route.paramMap.subscribe(async params => {
    this.id = +params.get('id');
    const jugadorResponse = await lastValueFrom(this.jugadorService.ListarPorId(this.id));
    if (jugadorResponse.data) {
      this.jugador = jugadorResponse.data;           
       if(this.jugador.foto)
      {
        this.imageSrc= this.jugador.foto;
      } 
       this.jugadorForm.setValue({
        nombre: this.jugador.nombre || '', 
        numero: this.jugador.numero !== null && this.jugador.numero !== undefined ? this.jugador.numero : '',  
        posicion: this.jugador.posicion || '',
        altura: this.jugador.altura || '',
        peso: this.jugador.peso || '',
        equipoSelec: this.jugador.equipo ? this.jugador.equipo.id || '' : '',
        equipoNombre: this.jugador.equipo ? this.jugador.equipo.nombre || '' : ''
      });
      if (this.jugador.estadisticasJugador) {                
        const partidosPromises = this.jugador.estadisticasJugador.map(e => {
          return lastValueFrom(this.partidoService.ListarPorId(e.partidoId));
        });       
        const partidosResponses = await Promise.all(partidosPromises);      
        this.partidos = partidosResponses.map(response => response.data);            
      }   
      this.updatePage();    
    }    
    if(localStorage.getItem('equipos')===null){
        this.equipoService.ListarEquipos(localStorage.getItem('usu')).subscribe(res=>{
        this.equipos= res.data;          
      });
    }
    else{
      this.equipos= JSON.parse(localStorage.getItem('equipos'));
    }    
  });   
}

  currentPage = 0;
  paginatedStats: any[] = [];
  paginatedPartidos: any[]= [];
  handlePageEvent(pageEvent: PageEvent){
    this.currentPage = pageEvent.pageIndex;
    this.updatePage();
    console.log(this.partidos);     
  }
  updatePage() {
    const startIndex = this.currentPage * 12;
    const endIndex = startIndex + 12;
    this.paginatedStats = this.jugador.estadisticasJugador.slice(startIndex, endIndex);
    this.paginatedPartidos = this.partidos.slice(startIndex, endIndex);
  }

VerMas(){
  this.verMas= !this.verMas;  
}
PorcentajeTC(estadistica: any):number { 
  if((estadistica.aciertos2Puntos +estadistica.aciertos3Puntos)==0){
    return 0;
  }  
   return Math.round((((estadistica.aciertos2Puntos +estadistica.aciertos3Puntos) / 
   (estadistica.intentos2Puntos + estadistica.intentos3Puntos)) * 100)*100) /100 ;
}

PorcentajesTiros(estadistica:any, tipo:string):number{
  let porcentaje:number=0;  
  if(tipo==="2pt"){
    if(estadistica.intentos2Puntos===0){
      porcentaje+=0;
    }
    else{
      porcentaje=(estadistica.aciertos2Puntos/ estadistica.intentos2Puntos)*100;
    }         
  }
  if(tipo==="3pt"){
    if(estadistica.intentos3Puntos===0){
      porcentaje+=0;
    }
    else{
      porcentaje=(estadistica.aciertos3Puntos/ estadistica.intentos3Puntos)*100;   
    }      
  }
  if(tipo==="1pt"){
    if(estadistica.intentos1Punto===0){
      porcentaje+=0;
    }
    else{
      porcentaje=(estadistica.aciertos1Punto/ estadistica.intentos1Punto)*100;
    }         
  }  
  return  Math.round(porcentaje * 100)/100;
}

formatTimeToMinutes(timeStr: string): string {  
  const [hours, minutes, seconds] = timeStr.split(":").map(parseFloat);  
  const totalMinutes = hours * 60 + minutes;  
  const formattedTime = `${totalMinutes.toString().padStart(2, "0")}:${Math.floor(seconds).toString().padStart(2, "0")}`;
  return formattedTime;
}

Promediar(estadistica:string):number{
  let promedio:number=0;  

  if(this.jugador.estadisticasJugador.length===0){
    return 0;
  }

  switch(estadistica){
    case "1pt": this.jugador.estadisticasJugador.forEach(e=>{
      promedio+= this.PorcentajesTiros(e,"1pt");      
    });
    break;
    case "2pt": this.jugador.estadisticasJugador.forEach(e=>{
      promedio+= this.PorcentajesTiros(e,"2pt");      
    });
    break;
    case "3pt": this.jugador.estadisticasJugador.forEach(e=>{
      promedio+= this.PorcentajesTiros(e,"3pt");      
    });    
    break;
    case "TC":this.jugador.estadisticasJugador.forEach(e=>{
      promedio+= this.PorcentajeTC(e);      
    });
    break;
    default: this.jugador.estadisticasJugador.forEach(e=>{       
      promedio+= e[estadistica];
    });  
    break;
  }    
  return Math.round((promedio/this.jugador.estadisticasJugador.length)*100)/100;
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

async Eliminar(){
  const dialogRef = this.dialog.open(ConfirmarComponent,{
    width:"350px",
    data: "Eliminar"
  });
  const result = await lastValueFrom(dialogRef.afterClosed());
  if(result){
      this.jugadorService.Eliminar(this.id).subscribe(res=>{
      if(res.exito===1){
      localStorage.removeItem('Jugadores');      
      this.router.navigate(["/Jugadores"]);
      }      
    });
  }     
}

ActivarModificar(){
 this.mod = !this.mod;
}

readURL(event: any) {
  if (event.target.files && event.target.files[0]) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
    this.imageSrc = e.target.result;
    this._file = file;
    };
    reader.readAsDataURL(file);
  }
}

reset() {    
  this.seleccion.nativeElement.value = "";    
  this.imageSrc= '';  
}

async handleImageUpload(file: any): Promise<string>{
    
  return new Promise<string>((resolve, reject) => {
    this.imgService.uploadImage(file).subscribe(res => {
      if (res.exito === 1) {
        resolve(res.data.blob.uri);
      } else {
        reject("Error al cargar la imagen");
      }
    });
  });    
} 
async Modificar() {
  const dialogRef = this.dialog.open(ConfirmarComponent, {
    width: "350px"
  });  
  const result = await lastValueFrom(dialogRef.afterClosed());  

  if (result) {
    const jugador = new Jugador();
    jugador.Nombre = this.jugadorForm.get('nombre').value;
    jugador.Numero = Number(this.jugadorForm.get('numero').value);
    jugador.Posicion = this.jugadorForm.get('posicion').value;
    jugador.Altura = Number(this.jugadorForm.get('altura').value);
    jugador.Peso = Number(this.jugadorForm.get('peso').value);
    jugador.EquipoId = Number(this.jugadorForm.get('equipoSelec').value);
    jugador.Id = this.id;
    
    const cargarImagen = async () => {
      if (this._file) {
        if (this._file.size > 1000000) {
          this.imgMensaje = "La imágen supera el tamaño máximo(1mb)";
          return null; 
        }
        try {
          const imagenUrl = await this.handleImageUpload(this._file);
          return imagenUrl;
        } catch (error) {
          console.error("Error al cargar la imagen:", error);
          return null;
        }
      } else {
        return null;
      }
    };    
    const imagenUrl = await cargarImagen();

    if (imagenUrl !== null) {
      jugador.Foto = imagenUrl;     
    }
    await this.jugadorService.ModificarJugador(jugador).subscribe(res => {      
      this.mensaje = res.mensaje;
      localStorage.removeItem('Jugadores');      
      localStorage.removeItem('equipos');
    });

    this.mod = !this.mod;
  } else {
    dialogRef.close();
  }
}

Change(){
  const value = this.jugadorForm.get('equipoSelec').value; 
    const index = this.equipos.findIndex(e=> e.id == value);
    if (index !== -1)
    this.jugador.equipo = this.equipos[index]; 
  else{
    this.jugadorForm.get('equipoSelec').setValue('');
    this.jugador.equipo.escudo = '';
    this.jugador.equipo.nombre='';
  }  
}

VerDetallesPartido(id:number,idLocal:number,idVisitante:number){
  this.router.navigate(['/partido',id,idVisitante,idLocal]);
}

}
