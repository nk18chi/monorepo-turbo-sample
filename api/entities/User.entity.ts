import { Types, Schema } from 'mongoose';
import { UserStatus } from '../graphql/types';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  status: UserStatus;
  followers: Schema.Types.ObjectId[];
  following: Schema.Types.ObjectId[];
}

export interface User {
  kind: 'User';
  _id: Types.ObjectId;
  name: string;
  email: string;
  status: UserStatus;
  followers: Schema.Types.ObjectId[];
  following: Schema.Types.ObjectId[];
}

export interface InvalidatedUser {
  kind: 'InvalidatedUser';
  name: string;
  email: string;
}

export interface ValidatedUser {
  kind: 'ValidatedUser';
  name: string;
  email: string;
}

export interface CreatedUser {
  kind: 'CreatedUser';
  _id: Types.ObjectId;
  name: string;
  email: string;
  status: UserStatus.Active;
}

export interface InvalidatedUserCommand {
  invalidatedUser: InvalidatedUser;
  user: User;
}

export interface ValidatedUserCommand {
  validatedUser: ValidatedUser;
  user: User;
}

export type UpdatedUser = Omit<User, 'kind'> & { kind: 'UpdatedUser' };

export default IUser;
