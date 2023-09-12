import { Time } from "@angular/common";
import { Jugador } from "./jugador";

export class EstadisticaJugador{
    public JugadorId:number= -1;
    
    public EquipoId:number=-1;

    public PartidoId:number= -1;  

    public Puntos:number=0;  

    public Asistencias:number=0;  

    public Rebotes:number=0;  

    public RebotesOfensivos:number=0;    

    public RebotesDefensivos:number=0;    

    public Robos:number=0;    

    public Tapones:number=0;    

    public Intentos2Puntos:number=0;    

    public Aciertos2Puntos:number=0;    

    public Intentos3Puntos:number=0;    

    public Aciertos3Puntos:number=0;    

    public Intentos1Punto:number=0;    

    public Aciertos1Punto:number=0;    

    public Faltas:number=0;    

    public Minutos:number= 0; 
    
    public Perdidas:number=0;
}