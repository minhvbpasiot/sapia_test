import {Injectable, UnauthorizedException} from '@nestjs/common';
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcryptjs';
import * as moment from "moment";

@Injectable()
export class AuthService {
  private readonly EMAIL_OR_PASSWORD_NOT_CORRECT = 'Email or password is not correct!';
  private readonly EMAIL_LOCKED = 'Email has been locked!';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(this.EMAIL_OR_PASSWORD_NOT_CORRECT);
    }

    if (user.locked) {
      throw new UnauthorizedException(this.EMAIL_LOCKED);
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (isMatch) {
      await this.usersService.updateUser(user._id, {
        failedLoginAttempts: 0,
        failedLoginTime: null
      })

      const payload = { email: user.email, sub: user._id };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }

    if (user.failedLoginAttempts == 0) {
      await this.usersService.updateUser(user._id, {
        failedLoginAttempts: 1,
        failedLoginTime: moment()
      });
      throw new UnauthorizedException(this.EMAIL_OR_PASSWORD_NOT_CORRECT);
    }

    if (user.failedLoginAttempts < 3) {
      await this.usersService.updateUser(user._id, {
        failedLoginAttempts: user.failedLoginAttempts + 1,
      });
      throw new UnauthorizedException(this.EMAIL_OR_PASSWORD_NOT_CORRECT);
    }

    const diffInMinutes = moment().diff(moment(user.failedLoginTime), 'minutes');
    if (diffInMinutes < 5) {
      await this.usersService.updateUser(user._id, {
        locked: true
      });
      throw new UnauthorizedException(this.EMAIL_LOCKED);
    }

    await this.usersService.updateUser(user._id, {
      failedLoginAttempts: 1,
      failedLoginTime: moment()
    });
    throw new UnauthorizedException(this.EMAIL_OR_PASSWORD_NOT_CORRECT);
  }
}
