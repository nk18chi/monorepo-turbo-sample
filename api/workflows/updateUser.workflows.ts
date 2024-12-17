import { ok, Result } from 'neverthrow';
import { InvalidatedUserCommand, ValidatedUserCommand, UpdatedUser } from '../entities/User.entity';
import { validatedCreateUser } from './createUser.workflows';

type ValidatedUserCommandResult = (command: InvalidatedUserCommand) => Result<ValidatedUserCommand, Error>;

const validatedUserCommand: ValidatedUserCommandResult = (command) => {
  const validatedUser = validatedCreateUser(command.invalidatedUser);
  const values = Result.combine([validatedUser]);
  return values.map(([validatedUserResult]) => ({
    validatedUser: validatedUserResult,
    user: command.user,
  }));
};

type UpdatedUserCommandResult = (command: ValidatedUserCommand) => Result<UpdatedUser, Error>;

const updatedUserCommand: UpdatedUserCommandResult = (command) => {
  const user: UpdatedUser = {
    ...command.user,
    ...command.validatedUser,
    kind: 'UpdatedUser',
  };
  return ok(user);
};

// workflow: invalidatedUserCommand => validatedUserCommand => updatedUser
type UpdateUserWorkflow = (command: InvalidatedUserCommand) => Result<UpdatedUser, Error>;
export const updateUserWorkflow: UpdateUserWorkflow = (command) =>
  ok(command).andThen(validatedUserCommand).andThen(updatedUserCommand);
