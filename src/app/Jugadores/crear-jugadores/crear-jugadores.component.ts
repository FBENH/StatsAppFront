import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ImagenService } from 'src/app/Services/imagen.service';
import { Response } from 'src/app/Models/response';
import { timeout } from 'rxjs';
import { Jugador } from 'src/app/Models/jugador';
import { JugadorService } from 'src/app/Services/jugador.service';
import { ViewChild } from '@angular/core';
import { EquipoService } from 'src/app/Services/equipo.service';

@Component({
  selector: 'app-crear-jugadores',
  templateUrl: './crear-jugadores.component.html',
  styleUrls: ['./crear-jugadores.component.scss']
})
export class CrearJugadoresComponent {

  @ViewChild('seleccion')
  seleccion : ElementRef;

  
  selecPlaceHolder= null;
  
  equipoSeleccionado:number=null;  
  imagenUrl: string | null = null;
  jugador:Jugador= new Jugador();

  imageSrc: string;
  _file: File;  
  
  equipos: any[];

  constructor(private jugadorService:JugadorService,
              private fb:FormBuilder,
              private imgService: ImagenService,
              private equipoService:EquipoService){
    
    if(localStorage.getItem('equipos')===null){
      this.equipoService.ListarEquipos(localStorage.getItem('usu')).subscribe(res=>{
        this.equipos= res.data
      });
    }
    else{
      this.equipos= JSON.parse(localStorage.getItem('equipos'));
    }
  } 

  jugadorForm = this.fb.group({
    nombre: ['', [Validators.required,Validators.maxLength(30),Validators.pattern(/^\S.*$/)]],
    numero: ['', [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern('^[0-9]+$')]],
    posicion: [''],
    altura: ['', [Validators.min(0),Validators.max(500)]],
    peso:['',[Validators.min(0),Validators.max(500)]],
    equipoSelec:['']        
  });

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

async CrearJugador(){  
  this.jugador.Nombre= this.jugadorForm.get('nombre').value ;
  this.jugador.Numero= Number(this.jugadorForm.get('numero').value);
  this.jugador.Posicion= this.jugadorForm.get('posicion').value ;
  this.jugador.Altura= Number(this.jugadorForm.get('altura').value);
  this.jugador.Peso= Number(this.jugadorForm.get('peso').value);
  this.jugador.EquipoId= Number(this.jugadorForm.get('equipoSelec').value);
  this.jugador.Usuario= localStorage.getItem('usu');
  if(this._file){
    if(this._file.size > 1000000){
      alert("La imágen supera el tamaño máximo(1mb)");
      return;
    }
    try {
      const imagenUrl = await this.handleImageUpload(this._file);
      this.jugador.Foto = imagenUrl;
    } catch (error) {
      console.error("Error al cargar la imagen:", error);
      return;
    }
    }      
    this.jugadorService.CrearJugador(this.jugador).subscribe(res=>{    
    if(res.exito===1){
      this.jugadorForm.reset();
      this.jugadorForm.get('posicion').setValue('');
      this.jugadorForm.get('equipoSelec').setValue('');           
    }
    this.reset();
    localStorage.removeItem('Jugadores');    
    alert(res.mensaje);
  });   
}

reset() {  
  this.seleccion.nativeElement.value = "";        
  this.imageSrc= '';
  this.imagenUrl= null;
  this.jugador.Foto= null;
  this._file= null;
}

nombreControl = this.jugadorForm.controls['nombre'];
numeroControl= this.jugadorForm.controls['numero'];
pesoControl= this.jugadorForm.controls['peso'];
alturaControl= this.jugadorForm.controls['altura'];

NombreError(nombre:FormControl){
  if(nombre.hasError('required')){
    return 'El nombre es requerido';
  }
  if(nombre.hasError('maxlength')){
    return 'No puede superar 30 carácteres';
  }
  if(nombre.hasError('pattern')){
    return 'No puede ser espacio en blanco ni empezar por espacio';
  }
  return '';
}
NumeroError(numero:FormControl){
  if(numero.hasError('required')){
    return 'El número es requerido.';
  }
  if(numero.hasError('min')){
    return 'Solo se aceptan números positivos.';
  }
  if(numero.hasError('max')){
    return 'El número no puede ser mayor a 100.';
  }
  if(numero.hasError('pattern')){
    return 'Solo se aceptan números enteros.';
  }
  return '';
}
ControlError(control: FormControl) {
  if (control.hasError('min') || control.hasError('max')) {
    return 'Valores entre 0-500';
  } else {
    return '';
  }
}

}

