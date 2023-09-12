import { DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, ElementRef , Renderer2 } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EquipoRapido } from 'src/app/Models/EquipoRapido';
import { Jugador } from 'src/app/Models/jugador';
import { EquipoService } from 'src/app/Services/equipo.service';
import { lastValueFrom} from 'rxjs';



@Component({
  selector: 'app-crear-equipo-rapido',
  templateUrl: './crear-equipo-rapido.component.html',
  styleUrls: ['./crear-equipo-rapido.component.scss']
})
export class CrearEquipoRapidoComponent {

  constructor(public dialogref:MatDialogRef<CrearEquipoRapidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private renderer: Renderer2, private el: ElementRef,
    private fb:FormBuilder,
    private equipoService:EquipoService,
    public dialogRef:MatDialogRef<CrearEquipoRapidoComponent>){}

    equipoRapido:EquipoRapido= new EquipoRapido();

    equipoForm = this.fb.group({
      nombre: ['', Validators.required],
      jugadores: this.fb.array([])
    });

    AddJugador(){
      const jugadorForm = this.fb.group({
        numero: ['',[Validators.required, Validators.max(99), Validators.min(0)]]
      });

      this.jugadores.push(jugadorForm);
    }

    DeleteJugador(jugadorIndex:number){
      this.jugadores.removeAt(jugadorIndex);
    }

    get jugadores(){
      return this.equipoForm.controls["jugadores"] as FormArray;
    }
    async CrearEquipo(){
      this.equipoRapido.IdUsuario  =  localStorage.getItem('usu');      
      this.equipoRapido.Nombre = this.equipoForm.get("nombre").value;
      this.jugadores.controls.forEach(j => {
        const _jugador = new Jugador();
        _jugador.Numero = j.get("numero").value;
        _jugador.Usuario = localStorage.getItem('usu');
        this.equipoRapido.Jugadores.push(_jugador);
      });
      const creado = await lastValueFrom(this.equipoService.CrearEquipoRapido(this.equipoRapido));

      if(creado){
        if(creado.exito===1){

          if(this.data)
          localStorage.setItem('selecLocal',creado.data);      
          else
          localStorage.setItem('selecVisita',creado.data);

          localStorage.removeItem('equipos');
          localStorage.removeItem('Jugadores');
          this.dialogRef.close({
            exito: true,
            data: creado.data,            
            local: this.data
          });
        }
        this.dialogRef.close();  
      }         
    }
}
