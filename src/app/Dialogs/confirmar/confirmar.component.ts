import { Component, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-confirmar',
  templateUrl: './confirmar.component.html',
  styleUrls: ['./confirmar.component.scss']
})
export class ConfirmarComponent {

  constructor(public dialogref:MatDialogRef<ConfirmarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any){}

}
