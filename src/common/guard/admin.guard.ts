import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AuthAdminGuard implements CanActivate {
  canActivate(constext: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    
    const request = constext.switchToHttp().getRequest();

    console.log('------------------------------')
    console.log(request['user'])
    console.log('------------------------------')

    if (request['user']?.role === 'diretor') return true;
    
    
    return false;
  }
}