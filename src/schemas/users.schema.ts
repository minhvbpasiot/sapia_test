import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({required: true, unique: true})
  email: string;

  @Prop({required: true})
  password: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({default: 0})
  failedLoginAttempts?: number;

  @Prop()
  failedLoginTime?: Date;

  @Prop()
  locked?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
