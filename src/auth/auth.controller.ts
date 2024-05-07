import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IncomingHttpHeaders } from 'http';
import { RawHeaders } from 'src/common/decorators/raw-headers.decorator';
import { AuthService } from './auth.service';
import { GetGreeting, GetGreeting2, GetGreeting3, GetGreeting4, GetUser } from './decorators';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("signup")
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post("login")
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post("login2")
  loginUser2(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login2(loginUserDto);
  }

  @Get("private")
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @Req() request: Request,
    @GetUser() user: User,
    @GetUser("email") userEmail: string,
    @RawHeaders() rawHeaders: string[]
  ) {
    console.log({ request });

    return {
      ok: true,
      message: "Hello private world",
      user,
      userEmail,
      rawHeaders
    };
  }

  @Get("greeting")
  greeting(
    @GetGreeting() greeting: string
  ) {
    console.log(greeting);
    return {
      param1: "123",
      greeting
    };
  }

  @Get("greeting2")
  greeting2(
    @GetGreeting2("Luis") greeting: string
  ) {
    console.log(greeting);
    return {
      param1: "123",
      greeting
    };
  }

  @Get("greeting3")
  greeting3(
    @GetGreeting3(["Luis", "Lourdes", "Jorge"]) greeting: string[]
  ) {
    return {
      param1: "123",
      greeting
    };
  }

  @Get("greeting4")
  @UseGuards(AuthGuard())
  greeting4(
    @GetGreeting4() user: User,
    @GetGreeting4() email: string
  ) {

    return {
      param1: "123",
      user,
      email
    };
  }

  @Get("headers")
  headers(
    @Headers() headers: IncomingHttpHeaders
  ) {
    return {
      param1: "123",
      headers
    };
  }
}
