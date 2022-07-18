import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto'
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { hashPassword } from "../app.utils";
import { User, UserDocument } from "../schemas/users.schema";
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  readonly EMAIL_OR_PASSWORD_IS_NOT_MATCH = 'Username or password is not correct!';
  readonly EMAIL_IS_EXIST = 'Email has been taken already!';

  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

  public async register(registerDto: RegisterDto) {
    if (registerDto.password != registerDto.confirmedPassword) {
      throw new BadRequestException(this.EMAIL_OR_PASSWORD_IS_NOT_MATCH);
    }

    const existUser = await this.userModel.findOne({ email: registerDto.email });
    if (existUser) {
      throw new BadRequestException(this.EMAIL_IS_EXIST);
    }

    const password = await hashPassword(registerDto.password);

    return new this.userModel({
      ...registerDto,
      password,
      createdAt: new Date(),
    }).save();
  }

  public async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email: email });
  }

  public async updateUser(id: string, data: {}) {
    await this.userModel.findByIdAndUpdate(id, data);
  }
}
