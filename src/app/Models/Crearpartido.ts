import { Estadistica } from "./estadistica";
import { EstadisticaJugador } from "./estadisticaJugador";
import { Partido } from "./partido";
import { statJ } from "./statJ";
import { StatP } from "./statP";

export class CrearPartido{
    public partido:Partido=new Partido();
    public statJ:statJ[]=[];
    public statP:StatP[]=[];

}