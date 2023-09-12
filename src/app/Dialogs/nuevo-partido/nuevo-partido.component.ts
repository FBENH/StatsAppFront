import { Component, Inject } from '@angular/core';
import { EquipoService } from 'src/app/Services/equipo.service';
import { MatDialog,MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CrearEquipoRapidoComponent } from '../crear-equipo-rapido/crear-equipo-rapido.component';
import { lastValueFrom} from 'rxjs';

@Component({
  selector: 'app-nuevo-partido',
  templateUrl: './nuevo-partido.component.html',
  styleUrls: ['./nuevo-partido.component.scss']
})
export class NuevoPartidoComponent {
  equipos:any[];
  public selecLocal?:any=null;
  public selecVisita?: any=null;
  fecha:Date=null;
  lugar:string=null;

  constructor(private equipoService:EquipoService,
              public dialogRef: MatDialogRef<NuevoPartidoComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public dialog:MatDialog){    
    const _equipos =JSON.parse(localStorage.getItem('equipos'));
    if(_equipos){
      this.equipos= _equipos;
    }
    else{
      equipoService.ListarEquipos(localStorage.getItem('usu')).subscribe(res=>{
        this.equipos= res.data;        
      });
      }      
    }


    get _selecLocal(): any {
      return this.selecLocal;
    }
  
    set _selecLocal(value: any) {      
      this.selecLocal = value;
      this.guardarSeleccion(true);
    }
    get _selecVisita(): any {
      return this.selecVisita;
    }
  
    set _selecVisita(value: any) {      
      this.selecVisita = value;
      this.guardarSeleccion(false);
    }
    guardarSeleccion(local:boolean) {
      if(local)  
      localStorage.setItem('selecLocal', this.selecLocal.id);
      if(!local)   
      localStorage.setItem('selecVisita', this.selecVisita.id);  
    }

    Iniciar(){
      if(!this.selecLocal || !this.selecVisita){
        alert("Debe seleccionar los 2 equipos");        
        return
      }
      else if(this.selecLocal === this.selecVisita){
        alert("Debe seleccionar equipos diferentes");
        return
      }

      this.dialogRef.close({
        local:JSON.stringify(this.selecLocal) , 
        visitante: JSON.stringify(this.selecVisita), 
        fecha:this.fecha,
        lugar:this.lugar});
    }
    async CrearEquiposRapido(local:boolean){
      const dialogRef = this.dialog.open(CrearEquipoRapidoComponent,{
        width:'700px',
        data: local
      });

      const data = await lastValueFrom(dialogRef.afterClosed());

      if(data){
        const equipos = await lastValueFrom(this.equipoService.ListarEquipos(localStorage.getItem('usu')));
        if(equipos){
          this.equipos = equipos.data;
          if(localStorage.getItem('selecLocal')){
            this.equipos.forEach(e=>{
              if(e.id == localStorage.getItem('selecLocal'))
              this.selecLocal= e;
            });
          }
          if(localStorage.getItem('selecVisita')){
            this.equipos.forEach(e=>{
              if(e.id == localStorage.getItem('selecVisita'))
              this.selecVisita= e;
            });
          }
          if(data.local){
            this.equipos.forEach(e=>{                
              if(e.id == data.data)
              this.selecLocal= e;
            });             
          }
          if(!data.local){
            this.equipos.forEach(e=>{                
              if(e.id == data.data)
              this.selecVisita= e;
            });   
          }          
        }               
      }      
    }    
  }

