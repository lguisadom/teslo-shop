import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";

export const GetGreeting4 = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException("User not found in request");
    }
    
    if (data === "email") {
      return user.email;
    }

    return user;
  }
);