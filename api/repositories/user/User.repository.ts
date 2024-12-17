import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import UserModel from './User.schema';
import { CreatedUser, UpdatedUser, User } from '../../entities/User.entity';
import { MongoId } from '../../objects/MongoId.object';

export const findUserById = (id: MongoId): ResultAsync<User | null, Error> =>
  ResultAsync.fromPromise(UserModel.findById(id).lean(), (err) => err as Error).andThen((user) => {
    if (!user) return okAsync(null);
    return okAsync(user);
  });

export const getUserById = (id: MongoId): ResultAsync<User, Error> =>
  findUserById(id).andThen((user) => {
    if (!user) return errAsync(new Error('Database Error: User not found'));
    return okAsync(user);
  });

export const saveCreatedUser = (model: CreatedUser): ResultAsync<User, Error> =>
  ResultAsync.fromPromise(UserModel.create(model), (err) => err as Error);

export const updateUser = (model: UpdatedUser): ResultAsync<User, Error> =>
  ResultAsync.fromPromise(UserModel.findByIdAndUpdate(model._id, model, { new: true }), (err) => err as Error).andThen(
    (user) => {
      if (!user) return errAsync(new Error('Database Error: User not found'));
      return okAsync(user);
    },
  );
