import DataLoader from 'dataloader';
import { Types } from 'mongoose';
import User from '../repositories/user/User.schema';
import IUser from '../entities/User.entity';

const userDataLoader = new DataLoader<Types.ObjectId, IUser>(async (keys) => {
  const uniqueKeys = Array.from(new Set(keys.map((key: Types.ObjectId) => key.toString())));
  const users = await User.find({ _id: { $in: uniqueKeys } }).lean();
  const userMap: { [key: string]: IUser } = {};
  users.forEach((user) => {
    userMap[user._id.toString()] = user;
  });
  return keys.map((key) => userMap[key.toString()]);
});

export default userDataLoader;
