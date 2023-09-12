import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ImagenService } from 'src/app/Services/imagen.service';
import { Response } from 'src/app/Models/response';
import { Observable, timeout } from 'rxjs';
import { Equipo } from 'src/app/Models/equipo';
import { EquipoService } from 'src/app/Services/equipo.service';
import { ViewChild } from '@angular/core';


@Component({
  selector: 'app-crear-equipo',
  templateUrl: './crear-equipo.component.html',
  styleUrls: ['./crear-equipo.component.scss']
})
export class CrearEquipoComponent {

  @ViewChild('seleccion')
  seleccion : ElementRef;
  
  equipoForm = this.fb.group({
    nombre: ['', [Validators.required,Validators.maxLength(30),Validators.pattern(/^\S.*$/)]],
    ciudad: ['', [Validators.maxLength(50),Validators.pattern(/^\S.*$/)]],
    entrenador: ['', [Validators.maxLength(50),Validators.pattern(/^\S.*$/)]],      
  });
  imagenUrl: string | null = null;
  equipo:Equipo= new Equipo();

  imageSrc: string;
  _file: File;

    

  constructor(private fb: FormBuilder,
              private imgService: ImagenService,
              private equipoService:EquipoService) {
                
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

  async CrearEquipo(){
    this.equipo.Nombre= String(this.equipoForm.get('nombre').value) ;
    this.equipo.Ciudad= this.equipoForm.get('ciudad').value;
    this.equipo.Entrenador= this.equipoForm.get('entrenador').value;
    this.equipo.Usuario = localStorage.getItem('usu');
    if(this._file){
      if(this._file.size > 1000000){
        alert("La imágen supera el tamaño máximo(1mb)");
        return;
      }
      try {
        const imagenUrl = await this.handleImageUpload(this._file);
        this.equipo.Escudo = imagenUrl;
      } catch (error) {
        console.error("Error al cargar la imagen:", error);
        return;
      }
      }          
      this.equipoService.CrearEquipo(this.equipo).subscribe(res=>{
      alert(res.mensaje);
      if(res.exito===1){
        this.equipoForm.reset();        
      }
    });
    this.reset();
    this.equipoForm.reset();
    localStorage.removeItem('equipos');
  }

  reset() {    
    this.seleccion.nativeElement.value = "";    
    this.imageSrc= '';
    this.imagenUrl= null;
    this.equipo.Escudo= null;
    this._file= null;
}


NombreControl = this.equipoForm.controls['nombre'];
CiudadControl= this.equipoForm.controls['ciudad'];
EntrenadorControl= this.equipoForm.controls['entrenador'];

NombreError(nombre:FormControl){
  if(nombre.hasError('required')){
    return 'Nombre: El nombre es requerido';
  }
  if(nombre.hasError('maxlength')){
    return 'Nombre: No puede superar 30 carácteres';
  }
  if(nombre.hasError('pattern')){
    return 'Nombre: No puede ser espacio en blanco ni empezar por espacio';
  }
  return '';
}
ControlError(control:FormControl, tipo:string){  
  if(control.hasError('maxlength')){    
      return tipo+'No puede superar 50 carácteres';     
  }
  if(control.hasError('pattern')){
    return tipo+'No puede ser espacio en blanco ni empezar por espacio';
  }
  return '';
}
}
