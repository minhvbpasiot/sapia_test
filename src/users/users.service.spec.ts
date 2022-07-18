import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {getConnectionToken, getModelToken, MongooseModule} from "@nestjs/mongoose";
import {UsersModule} from "./users.module";
import {User} from "../schemas/users.schema";
import {NestExpressApplication} from "@nestjs/platform-express";
import {Connection, Model} from "mongoose";
import {ValidationPipe} from "@nestjs/common";

describe('UsersService', () => {
  const EMAIL_OR_PASSWORD_IS_NOT_MATCH = 'Username or password is not correct!';
  const EMAIL_IS_EXIST = 'Email has been taken already!';

  let service: UsersService;
  let app: NestExpressApplication;
  let userModel: Model<User>;

  let email = 'test@test.com';
  let password = '123456';
  let firstName = 'Test';
  let lastName = 'Test';
  let invalidPassword = '1234567';

  const register = () => {
    return service.register({
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
    await app.listen(3333);

    userModel = module.get<Model<User>>(getModelToken(User.name));
    service = module.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    await (app.get(getConnectionToken()) as Connection).db.dropDatabase();
    await app.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an user', async () => {
    jest.spyOn(userModel, 'create').mockImplementationOnce(() =>
      Promise.resolve({
        email,
        password,
        confirmedPassword: password,
      }),
    );

    const result = await register();

    expect(result._id).not.toBeNull();
  });

  it('should fail if register with existed email', async () => {
    const registerOnce = await register();
    expect(registerOnce._id).not.toBeNull();

    try {
      await register();
    } catch (error) {
      expect(error.message).toBe(EMAIL_IS_EXIST);
    }
  });

  it('should be register failed if wrong password', async () => {
    try {
      await service.register({
        email,
        password,
        confirmedPassword: invalidPassword,
      });
    } catch (error) {
      expect(error.message).toBe(EMAIL_OR_PASSWORD_IS_NOT_MATCH);
    }
  });
});
