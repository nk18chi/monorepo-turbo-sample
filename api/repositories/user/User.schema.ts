import { model, Schema } from 'mongoose';
import { UserStatus } from '../../graphql/types';
import { User } from '../../entities/User.entity';

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  status: { type: String, required: true, enum: UserStatus, default: UserStatus.Active },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

const UserModel = model<User>('User', userSchema);

export default UserModel;
