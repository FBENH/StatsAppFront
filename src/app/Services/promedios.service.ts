import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PromediosService {

  constructor() { }

  PorcentajeTC(estadistica: any):number { 
    if((estadistica.aciertos2Puntos +estadistica.aciertos3Puntos)==0){
      return 0;
    }  
     return Math.round((((estadistica.aciertos2Puntos +estadistica.aciertos3Puntos) / 
     (estadistica.intentos2Puntos + estadistica.intentos3Puntos)) * 100)*100) /100 ;
  }
  PorcentajesTiros(estadistica:any, tipo:string):number{
    let porcentaje:number=0;  
    if(tipo==="2pt"){
      if(estadistica.intentos2Puntos===0){
        porcentaje+=0;
      }
      else{
        porcentaje=(estadistica.aciertos2Puntos/ estadistica.intentos2Puntos)*100;
      }         
    }
    if(tipo==="3pt"){
      if(estadistica.intentos3Puntos===0){
        porcentaje+=0;
      }
      else{
        porcentaje=(estadistica.aciertos3Puntos/ estadistica.intentos3Puntos)*100;   
      }      
    }
    if(tipo==="1pt"){
      if(estadistica.intentos1Punto===0){
        porcentaje+=0;
      }
      else{
        porcentaje=(estadistica.aciertos1Punto/ estadistica.intentos1Punto)*100;
      }         
    }  
    return  Math.round(porcentaje * 100)/100;
  }

  Promediar(estadistica:string, objeto:any):number{
    let promedio:number=0;  
  
    if(objeto.length===0){
      return 0;
    }
  
    switch(estadistica){
      case "1pt": objeto.forEach(e=>{
        promedio+= this.PorcentajesTiros(e,"1pt");      
      });
      break;
      case "2pt": objeto.forEach(e=>{
        promedio+= this.PorcentajesTiros(e,"2pt");      
      });
      break;
      case "3pt": objeto.forEach(e=>{
        promedio+= this.PorcentajesTiros(e,"3pt");      
      });    
      break;
      case "TC":objeto.forEach(e=>{
        promedio+= this.PorcentajeTC(e);      
      });
      break;
      default: objeto.forEach(e=>{       
        promedio+= e[estadistica];
      });  
      break;
    }    
    return Math.round((promedio/objeto.length)*100)/100;
  }

  formatTimeToMinutes(timeStr: string): string {  
    const [hours, minutes, seconds] = timeStr.split(":").map(parseFloat);  
    const totalMinutes = hours * 60 + minutes;  
    const formattedTime = `${totalMinutes.toString().padStart(2, "0")}:${Math.floor(seconds).toString().padStart(2, "0")}`;
    return formattedTime;
  }
}
