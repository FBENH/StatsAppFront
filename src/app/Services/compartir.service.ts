import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompartirService {

  constructor() { }

  private dataSubjectL = new BehaviorSubject<any>({});
  public dataL$ = this.dataSubjectL.asObservable();
  private dataSubjectV = new BehaviorSubject<any>({});
  public dataV$ = this.dataSubjectV.asObservable();
  private dataSubjectF = new BehaviorSubject<any>({});
  public dataF$ = this.dataSubjectF.asObservable();
  private dataSubjectLug = new BehaviorSubject<any>({});
  public dataLug$ = this.dataSubjectLug.asObservable();

  setData(local: any,visitante:any,lugar:string,fecha:Date) {
    this.dataSubjectL.next(local);
    this.dataSubjectV.next(visitante);
    this.dataSubjectLug.next(lugar);
    this.dataSubjectF.next(fecha);
  }
}
