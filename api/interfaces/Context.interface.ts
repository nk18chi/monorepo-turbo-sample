import DataLoader from 'dataloader';
import { Types } from 'mongoose';
import { BaseContext } from '@apollo/server';
import IAuthorizedUser from './AuthorizedUser.interface';
import IUser from '../entities/User.entity';

export interface Context extends BaseContext {
  user?: IAuthorizedUser;
  dataLoaders: {
    userDataLoader: DataLoader<Types.ObjectId, IUser, Types.ObjectId>;
  };
}

export default Context;
