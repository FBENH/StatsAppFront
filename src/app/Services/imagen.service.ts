import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Response } from '../Models/response';

@Injectable({
  providedIn: 'root'
})
export class ImagenService {

  constructor(private http:HttpClient) { }
  apiService= "https://statsappapi.azurewebsites.net/Imagen/Upload";
  /* apiService= "https://localhost:7056/Imagen/Upload"; */
  
  uploadImage(image: File): Observable<Response> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http.post<any>(this.apiService, formData).pipe(map(res=>{
      if(res){        
        return res;
      }
      
    }));
  }
  getImageUrl(imageId: number): Observable<string> {
    const apiUrl = `https://localhost:7056/imagen/${imageId}`;
    return this.http.get<string>(apiUrl);
  }
  
}

