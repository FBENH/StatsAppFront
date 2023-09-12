import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipoService } from 'src/app/Services/equipo.service';
import { JugadorService } from 'src/app/Services/jugador.service';
import { PartidoService } from 'src/app/Services/partido.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmarComponent } from 'src/app/Dialogs/confirmar/confirmar.component';
import { ImagenService } from 'src/app/Services/imagen.service';
import { lastValueFrom, timeout } from 'rxjs';
import { Response } from 'src/app/Models/response';
import { Equipo } from 'src/app/Models/equipo';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-equipo-detalle',
  templateUrl: './equipo-detalle.component.html',
  styleUrls: ['./equipo-detalle.component.scss']
})
export class EquipoDetalleComponent implements OnInit{
  @ViewChild('seleccion')
  seleccion : ElementRef;
  imagenUrl:string;
  imgMensaje:string;
  mensaje:string;
  imageSrc: string;
  _file: File;

  equipo:any;
  id:number;
  mod:boolean= false;
  partidos:any[];
  equipoForm = this.fb.group({
    nombre: ['', Validators.required],
    ciudad:[''],
    entrenador: ['']
  });

  constructor(private route:ActivatedRoute,
    private equipoService:EquipoService,
    private fb:FormBuilder,
    private router:Router,
    private partidoService:PartidoService,
    private jugadorService:JugadorService,
    private dialog:MatDialog,
    private imgService:ImagenService){
  }
  async ngOnInit(){    
      const params = await this.route.paramMap.subscribe(async params=>{
        this.id = +params.get('id');
        const res = await lastValueFrom(this.equipoService.ListarPorId(this.id));
        if (res.data) {
          this.equipo = res.data;
          this.imageSrc= this.equipo.escudo;
          this.equipoForm.setValue({
            nombre: this.equipo.nombre || '',
            ciudad: this.equipo.ciudad || '',
            entrenador: this.equipo.entrenador || ''
          });  
          if (this.equipo.estadisticasPartidos) {
              const partidosPromises = this.equipo.estadisticasPartidos.map(async e => {
              const response = await lastValueFrom(this.partidoService.ListarPorId(e.partidoId));
              return response.data;
            });
  
            this.partidos = (await Promise.all(partidosPromises)).filter(p=> p.equipoLocalId === this.id ||
              p.equipoVisitanteId === this.id);             
          }
          this.updatePage(); 
        }  
      }); 
         
  }
  currentPage = 0;
  paginatedStats: any[] = [];
  paginatedPartidos: any[]=[];
  handlePageEvent(pageEvent: PageEvent){
    this.currentPage = pageEvent.pageIndex;
    this.updatePage();     
  }
  updatePage() {
    const startIndex = this.currentPage * 12;
    const endIndex = startIndex + 12;
    this.paginatedStats = this.equipo.estadisticasPartidos.slice(startIndex, endIndex);
    this.paginatedPartidos = this.partidos.slice(startIndex,endIndex);
  }
  reset() {    
    this.seleccion.nativeElement.value = "";    
    this.imageSrc= '';  
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
  ActivarModificar(){    
    this.mod = !this.mod;
  }

  VerDetallesJugador(id:number){
    this.router.navigate(['jugador',id]);
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

  Promediar(estadistica:string):number{
    let promedio:number=0;  

    if(this.equipo.estadisticasPartidos.length===0){
      return 0;
    }

    switch(estadistica){
      case "1pt": this.equipo.estadisticasPartidos.forEach(e=>{
        promedio+= this.PorcentajesTiros(e,"1pt");      
      });
      break;
      case "2pt": this.equipo.estadisticasPartidos.forEach(e=>{
        promedio+= this.PorcentajesTiros(e,"2pt");      
      });
      break;
      case "3pt": this.equipo.estadisticasPartidos.forEach(e=>{
        promedio+= this.PorcentajesTiros(e,"3pt");      
      });    
      break;
      case "TC":this.equipo.estadisticasPartidos.forEach(e=>{
        promedio+= this.PorcentajeTC(e);      
      });
      break;
      default: this.equipo.estadisticasPartidos.forEach(e=>{       
        promedio+= e[estadistica];
      });  
      break;
    }    
    return Math.round((promedio/this.equipo.estadisticasPartidos.length)*100)/100;
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

  async Eliminar(id:number){
    const dialogRef = this.dialog.open(ConfirmarComponent,{
      width:"350px",
      data: "Eliminar"
    });
    const result = await lastValueFrom(dialogRef.afterClosed());
    if(result){
    this.equipoService.Eliminar(id).subscribe(res=>{
      if(res.exito===1){        
      localStorage.removeItem('equipos');
      localStorage.removeItem('Jugadores');      
      this.router.navigate(['/Equipos']);
      }      
    });
  }
  }
  
  async Modificar() {
    const dialogRef = this.dialog.open(ConfirmarComponent, {
      width: "350px"
    });
    const result = await lastValueFrom(dialogRef.afterClosed());
  
    if (result) {
      const equipo = new Equipo();
      equipo.Nombre = this.equipoForm.get('nombre').value;
      equipo.Ciudad = this.equipoForm.get('ciudad').value;
      equipo.Entrenador = this.equipoForm.get('entrenador').value;
      equipo.Id = this.equipo.id;  
      
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
            this.imgMensaje = "Error al cargar la imagen";
            return null; 
          }
        } else {
          return null;
        }
      }; 
      
      const imagenUrl = await cargarImagen();
  
      if (imagenUrl !== null) {
        equipo.Escudo = imagenUrl;       
      }
      await this.equipoService.Modificar(equipo).subscribe(res => {
        this.mensaje = res.mensaje;
        localStorage.removeItem('Jugadores');        
        localStorage.removeItem('equipos');
      });

      this.mod = !this.mod;
    } else {
      dialogRef.close();
    }
  }
  VerDetallesPartido(id:number,idLocal:number,idVisitante:number){
    this.router.navigate(['/partido',id,idVisitante,idLocal]);
  } 
}
