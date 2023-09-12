import{Injectable} from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { UsuarioServiceService } from '../Services/usuario-service.service';

@Injectable({providedIn:'root'})
export class AuthGuard{

constructor(private router:Router,
    private userService: UsuarioServiceService){}

canActivate(route: ActivatedRouteSnapshot){
    const user = this.userService.userData;
    if(user){
        return true;
    }    
    this.router.navigate(['login']);
    return false;
}    

}