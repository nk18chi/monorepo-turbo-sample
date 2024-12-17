const userTypeDef = `#graphql
type User @cacheControl(maxAge: 60) {
  _id: ID!
  name: String!
  followers: [User]
  following: [User]
}

type OptimizedUser @cacheControl(maxAge: 60) {
  _id: ID!
  name: String!
  followers: [User]
  following: [User]
}

type UserConnection {
  edges: [UserEdge]
  pageInfo: PageInfo
}

type UserEdge {
  node: User
  cursor: String
}

type PageInfo {
  endCursor: String
  hasNextPage: Boolean
}

type Query {
  users(first: Int!, after: String): UserConnection
  getUsers: [User]
  optimizedGetUsers: [OptimizedUser]
  authorizedGetUsers: [User]
  userToken: String @cacheControl(maxAge: 0) @rateLimit(limit: 3, duration: 5)
}

type Mutation {
  createUser(input: InvalidatedCreateUserInput!): User!
  updateUser(userId: String!, input: InvalidatedUpdateUserInput!): User!
}

input InvalidatedCreateUserInput {
  name: String!
  email: String!
}

input InvalidatedUpdateUserInput {
  name: String!
  email: String!
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

`;

export default userTypeDef;
