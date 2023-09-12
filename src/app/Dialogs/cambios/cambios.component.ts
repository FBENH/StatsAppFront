import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {  MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-cambios',
  templateUrl: './cambios.component.html',
  styleUrls: ['./cambios.component.scss']
})
export class CambiosComponent {

  jugadoresLocal?:any[]=[];
  jugadoresVisitante?:any[]=[];

  titularesLocal:any[]=[];
  titularesVisitante:any[]=[];

  constructor(public dialogRef:MatDialogRef<CambiosComponent>,
              @Inject(MAT_DIALOG_DATA) public data:any){
    if(this.data.jugadoresLocal){
      this.jugadoresLocal = JSON.parse(this.data.jugadoresLocal);
    }
    if(this.data.jugadoresVisitante){
      this.jugadoresVisitante=JSON.parse(this.data.jugadoresVisitante);
    }
    if(this.data.titularesLocal){
      this.titularesLocal=JSON.parse(this.data.titularesLocal);
    }
    if(this.data.titularesVisitante){
      this.titularesVisitante=JSON.parse(this.data.titularesVisitante);
    }     
  }

  titularLocal(jugador:any){
    if(this.titularesLocal.find(j=> j.id === jugador.id)){
      const index= this.titularesLocal.findIndex(j=> j.id === jugador.id);
      this.titularesLocal.splice(index,1);  
      this.jugadoresLocal.splice(index,1);
      this.jugadoresLocal.push(jugador);     
      return;
    }    
    if(this.titularesLocal.length<5){      
     this.titularesLocal.splice(0,0,jugador);     
     const index= this.jugadoresLocal.findIndex(j=> j.id === jugador.id);     
     this.jugadoresLocal.splice(index,1);
     this.jugadoresLocal.splice(0,0,jugador);        
    }
    else{
      const index= this.jugadoresLocal.findIndex(j=> j.id === jugador.id);
      this.titularesLocal.pop();
      this.titularesLocal.splice(0,0,jugador);      
      this.jugadoresLocal.splice(index,1);
      this.jugadoresLocal.splice(0,0,jugador);     
    }      
  }
  titularVisitante(jugador:any){
    if(this.titularesVisitante.find(j=> j.id === jugador.id)){
      const index= this.titularesVisitante.findIndex(j=> j.id === jugador.id);
      this.titularesVisitante.splice(index,1); 
      this.jugadoresVisitante.splice(index,1);
      this.jugadoresVisitante.push(jugador);     
      return;
    }    
    if(this.titularesVisitante.length<5){
      this.titularesVisitante.splice(0,0,jugador);
      const index= this.jugadoresVisitante.findIndex(j=> j.id === jugador.id);     
      this.jugadoresVisitante.splice(index,1);
      this.jugadoresVisitante.splice(0,0,jugador);
    }
    else{
      const index= this.jugadoresVisitante.findIndex(j=> j.id === jugador.id);
      this.titularesVisitante.pop();
      this.titularesVisitante.splice(0,0,jugador);
      this.jugadoresVisitante.splice(index,1);
      this.jugadoresVisitante.splice(0,0,jugador);  
    }     
  }

  enTitulares(jugador:any):boolean{    
  const foundLocal = this.titularesLocal.find(j => j.id === jugador.id);
  const foundVisitante = this.titularesVisitante.find(j => j.id === jugador.id);
  return foundLocal || foundVisitante;   
  }

  Iniciar(){       
    this.dialogRef.close({titularesLocal: JSON.stringify(this.titularesLocal), titularesVisitante: JSON.stringify(this.titularesVisitante)});
  }

  
}
