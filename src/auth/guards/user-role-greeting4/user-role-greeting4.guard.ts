import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class UserRoleGreeting4Guard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log("Begin UserRoleGreeting4Guard - canActivate");
    const validRoles: string[] = this.reflector.get("roles", context.getHandler())
    console.log({ validRoles });

    return true;
  }
}
