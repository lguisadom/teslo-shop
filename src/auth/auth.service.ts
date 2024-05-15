import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from "bcrypt";
import { Repository } from 'typeorm';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user: User = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });

      await this.userRepository.save(user);

      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      };

    } catch (error) {
      console.error(error);
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const userDB: User = await this.userRepository.findOneBy({ email });

    if (!bcrypt.compareSync(password, userDB.password)) {
      throw new UnauthorizedException("Credentials are not valid");
    }

    return userDB;
  }

  async login2(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user: User = await this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, password: true }
    });

    console.log({ user });

    if (!user) {
      throw new UnauthorizedException("Credentials are not valid");
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException("Credentials are not valid");
    }

    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };
  }

  async checkAuthStatus(user: User) {
    console.log("checkAuthStatus with user: ", {user});

    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token: string = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === "23505") {
      throw new BadRequestException(error.detail);
    } else {
      console.error(error);
      throw new InternalServerErrorException("Please check server logs");
    }
  }
}
