import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NuevoPartidoComponent } from '../Dialogs/nuevo-partido/nuevo-partido.component';
import { CompartirService } from '../Services/compartir.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  constructor(private router:Router,
              private dialog:MatDialog,
              private data:CompartirService){}

  ngOnInit(){
    localStorage.removeItem('selecLocal');
    localStorage.removeItem('selecVisita');
  }
  
  toggleBtn:boolean= false;
  
  
  CerrarSesion(){
    localStorage.removeItem('usuLog');
    localStorage.removeItem('usu');
    localStorage.removeItem('Jugadores');
    localStorage.removeItem('equipos');
    localStorage.removeItem('partidos');
    this.router.navigate(['/']);
  }

  ToggleBtn(){
    this.toggleBtn= !this.toggleBtn;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(NuevoPartidoComponent, {
      width: '700px', 
      data: {}      
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.data.setData(result.local,result.visitante,result.lugar,result.fecha);       
        this.router.navigate(['/vivo']);
      }
    });
  }
}

