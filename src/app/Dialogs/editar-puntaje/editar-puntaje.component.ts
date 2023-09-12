import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-editar-puntaje',
  templateUrl: './editar-puntaje.component.html',
  styleUrls: ['./editar-puntaje.component.scss']
})
export class EditarPuntajeComponent {

  puntos:number;
  local:boolean;

  constructor(public dialogRef: MatDialogRef<EditarPuntajeComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any){
      this.puntos = this.data.puntos;
      this.local = this.data.local;
    }

    Ok(){
      this.dialogRef.close(this.puntos);
    }
}
