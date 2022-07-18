import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {getConnectionToken, getModelToken, MongooseModule} from "@nestjs/mongoose";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {UsersModule} from "../users/users.module";
import {User} from "../schemas/users.schema";
import {Connection, Model} from "mongoose";
import {NestExpressApplication} from "@nestjs/platform-express";
import {ValidationPipe} from "@nestjs/common";
import {UsersService} from "../users/users.service";
import {AuthModule} from "./auth.module";

describe('AuthService', () => {
  const EMAIL_OR_PASSWORD_IS_NOT_MATCH = 'Email or password is not correct!';
  const EMAIL_IS_EXIST = 'Email has been taken already!';

  let authService: AuthService;
  let userService: UsersService;
  let app: NestExpressApplication;
  let userModel: Model<User>;

  let email = 'test@test.com';
  let password = '123456';
  let firstName = 'Test';
  let lastName = 'Test';
  let invalidPassword = '1234567';
  let invalidEmail = 'invalid@test.com';

  const register = () => {
    return userService.register({
      email,
      password,
      confirmedPassword: password,
      firstName,
      lastName,
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const username = configService.get('MONGO_USERNAME');
            const password = configService.get('MONGO_PASSWORD');
            const port = configService.get('MONGO_PORT');
            const isDocker = configService.get('IS_DOCKER');

            return {
              uri: `mongodb://${username}:${password}@${isDocker === 'true' ? 'mongodb' : 'localhost'}:${port}`,
              // uri: `mongodb://localhost`,
              dbName: 'test',
            };
          },
          inject: [ConfigService],
        }),
        UsersModule,
        AuthModule
      ],
      providers: [
        {
          provide: getModelToken(User.name),
          useValue: Model,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.listen(4444);

    userModel = module.get<Model<User>>(getModelToken(User.name));
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    await (app.get(getConnectionToken()) as Connection).db.dropDatabase();
    await app.close();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
  });

  it('should login successfully', async () => {
    await register();
    const result = await authService.login({
      email,
      password
    });

    expect(result.access_token).not.toBeNull();
  });

  it('should be login failed if wrong password or wrong email', async () => {
    await register();

    try {
      await authService.login({
        email,
        password: invalidPassword
      });
    } catch (error) {
      expect(error.message).toBe(EMAIL_OR_PASSWORD_IS_NOT_MATCH);
    }

    try {
      await authService.login({
        email: invalidEmail,
        password
      });
    } catch (error) {
      expect(error.message).toBe(EMAIL_OR_PASSWORD_IS_NOT_MATCH);
    }
  });
});
