import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { ok } from "neverthrow";
import User from "../../repositories/user/User.schema";
import { Resolvers } from "../types";
import IUser, { InvalidatedUser, InvalidatedUserCommand } from "../../entities/User.entity";
import { createUserWorkflow } from "../../workflows/createUser.workflows";
import { getUserById, saveCreatedUser, updateUser } from "../../repositories/user/User.repository";
import { updateUserWorkflow } from "../../workflows/updateUser.workflows";
import { MongoId } from "../../objects/MongoId.object";

const userResolver: Resolvers = {
  Query: {
    users: async (_, { first, after }) => {
      const query = after ? { _id: { $gt: after } } : {};
      const users = await User.find(query)
        .sort({ _id: 1 })
        .limit(first + 1)
        .lean();
      const hasNextPage = users.length > first;
      const edges = hasNextPage ? users.slice(0, -1) : users;
      return {
        edges: edges.map((user) => ({
          cursor: user._id.toString(),
          node: user,
        })),
        pageInfo: {
          endCursor: edges[edges.length - 1]?._id.toString(),
          hasNextPage,
        },
      };
    },

    // call User.find method 53 times
    // (1 time for getUsers + 26 times for 26 user's followers + 26 times for 26 user's following)
    getUsers: async () => User.find().lean(),

    // call User.find method 2 time (1 time for getUsers + 1 time for 26 user's followers and 26 user's following)
    // optimizedGetUsers: async () => User.find().lean(),

    authorizedGetUsers: async () => User.find().lean(),
    userToken: async () => {
      const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
      return jwt.sign({ _id: new Types.ObjectId() }, privateKey);
    },
  },

  Mutation: {
    createUser: (_, { input }) => {
      const workflow = createUserWorkflow;

      const invalidatedUser: InvalidatedUser = {
        kind: "InvalidatedUser",
        name: input.name,
        email: input.email,
      };

      const result = ok(invalidatedUser).andThen(workflow).asyncAndThen(saveCreatedUser);

      return result.match(
        (user) => user,
        (error) => {
          throw error;
        }
      );
    },

    updateUser: async (_, { userId, input }) => {
      const workflow = updateUserWorkflow;

      const preprocess = await MongoId(userId)
        .asyncAndThen(getUserById)
        .match(
          (user) => {
            const invalidatedUserCommand: InvalidatedUserCommand = {
              invalidatedUser: {
                kind: "InvalidatedUser",
                name: input.name,
                email: input.email,
              },
              user,
            };
            return ok(invalidatedUserCommand);
          },
          (error) => {
            throw error;
          }
        );

      const result = preprocess.andThen(workflow).asyncAndThen(updateUser);

      return result.match(
        (user) => user,
        (error) => {
          throw error;
        }
      );
    },
  },

  User: {
    followers: async (user) => User.find({ _id: { $in: user.followers } }).lean(),
    following: async (user) => User.find({ _id: { $in: user.following } }).lean(),
  },

  OptimizedUser: {
    followers: async (user, _, context) => {
      const {
        dataLoaders: { userDataLoader },
      } = context;
      return (await userDataLoader.loadMany(user.followers as unknown as ArrayLike<Types.ObjectId>)) as IUser[];
    },
    following: async (user, _, context) => {
      const {
        dataLoaders: { userDataLoader },
      } = context;
      return (await userDataLoader.loadMany(user.following as unknown as ArrayLike<Types.ObjectId>)) as IUser[];
    },
  },
};

export default userResolver;
