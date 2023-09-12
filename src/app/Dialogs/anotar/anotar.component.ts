import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-anotar',
  templateUrl: './anotar.component.html',
  styleUrls: ['./anotar.component.scss']
})
export class AnotarComponent {
  local?:any;
  visitante?:any;

  titularesLocal?:any[];
  titularesVisitante?:any[];

  equipoSelec:any= null;
  jugadorSelec:any=null;  

  elegirEquipo:boolean=true;


  constructor(public dialogRef: MatDialogRef<AnotarComponent>,
              @Inject(MAT_DIALOG_DATA)public data:any){
      if(this.data.local){
        this.local= JSON.parse(this.data.local);
      }
      if(this.data.visitante){
        this.visitante= JSON.parse(this.data.visitante);
      }
      if(this.data.titularesLocal){
        this.titularesLocal=JSON.parse(this.data.titularesLocal);
      }
      if(this.data.titularesVisitante){
        this.titularesVisitante=JSON.parse(this.data.titularesVisitante);
      }    
  }

  elegir(equipo:any){
    this.equipoSelec= equipo;
    this.elegirEquipo=false;
  }
  elegirJugador(jugador:any){    
    this.jugadorSelec= jugador;
    this.dialogRef.close({equipo:JSON.stringify(this.equipoSelec),jugador:JSON.stringify(this.jugadorSelec)});
  }

  Ok(){
    this.dialogRef.close();
  }
}
