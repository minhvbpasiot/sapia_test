import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from "../users/users.service";
import { ApiOperation } from "@nestjs/swagger";
import { RegisterDto } from "../users/dto/register.dto";
import {LoginDto} from "./dto/login.dto";
import {AuthService} from "./auth.service";

@Controller('v1/auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  @Post('register')
  async register(@Body() payload: RegisterDto) {
    return await this.usersService.register(payload);
  }

  @Post('login')
  async login(@Body() payload: LoginDto) {
    return await this.authService.login(payload);
  }
}
