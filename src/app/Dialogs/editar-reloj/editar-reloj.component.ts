import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-editar-reloj',
  templateUrl: './editar-reloj.component.html',
  styleUrls: ['./editar-reloj.component.scss']
})
export class EditarRelojComponent {

  minutos: number;
  segundos: number;
  milisegundos: number;
  tiempoRestante: number;

  constructor(public dialogRef: MatDialogRef<EditarRelojComponent>,
    @Inject(MAT_DIALOG_DATA) public data:number) {
    this.tiempoRestante= data;
    this.desglosarMilisegundos(this.tiempoRestante);
  }

  desglosarMilisegundos(valorEnMilisegundos: number) {
    const minutos = Math.floor(valorEnMilisegundos / 60000);
    const segundos = Math.floor((valorEnMilisegundos % 60000) / 1000);
    const milisegundos = valorEnMilisegundos % 1000;
  
    this.minutos = minutos;
    this.segundos = segundos;
    this.milisegundos = milisegundos;
  }

  actualizarTiempoTotal() {
    this.tiempoRestante = (this.minutos * 60 + this.segundos) * 1000 + this.milisegundos;
  }

  Aceptar(){
    this.actualizarTiempoTotal();
    this.dialogRef.close({
      tiempo: this.tiempoRestante
    });
  }
}
