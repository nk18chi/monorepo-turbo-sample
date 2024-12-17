import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { applyMiddleware } from 'graphql-middleware';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from 'graphql-query-complexity';
import { OperationDefinitionNode as OperationNode } from 'graphql';
import jwt from 'jsonwebtoken';
import { rateLimitDirective } from 'graphql-rate-limit-directive';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import * as Sentry from '@sentry/node';

import connectMongoDB from './mongo/connect';
import logger from './config/logger';
import typeDefs from './graphql/schemas';
import resolvers from './graphql/resolvers';
import 'dotenv/config';
import userDataLoader from './dataloader/User.dataLoader';
import Context from './graphql/interface/Context.interface';
import permissions from './graphql/authorizations/permissions';
import IAuthorizedUser from './graphql/interface/AuthorizedUser.interface';

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } = rateLimitDirective();

const runServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const schema = applyMiddleware(
    makeExecutableSchema({
      typeDefs: [...typeDefs, rateLimitDirectiveTypeDefs],
      resolvers,
    }),
    permissions,
  );

  const MAX_COMPLEXITY = process.env.GRAPHQL_QUERY_MAX_COMPLEXITY;
  const server = new ApolloServer<Context>({
    schema: rateLimitDirectiveTransformer(schema),
    persistedQueries: {},
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        requestDidStart: async () => ({
          async didResolveOperation({ request, document }) {
            const operationName = request.operationName ?? (document.definitions[0] as OperationNode).name?.value;
            if (operationName === 'IntrospectionQuery') return;
            const complexity = getComplexity({
              schema,
              operationName,
              query: document,
              variables: request.variables,
              estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
            });

            if (complexity > MAX_COMPLEXITY) {
              // eslint-disable-next-line max-len
              const errorMessage = `Sorry, too complicated query! ${complexity} exceeded the maximum allowed complexity of ${MAX_COMPLEXITY} by ${operationName}`;
              const error = new Error(errorMessage);
              logger.error(errorMessage, error);
              throw error;
            }
            logger.info(`Used query complexity points: ${complexity} by ${operationName}`);
          },
          async didEncounterErrors(ctx) {
            ctx.errors.forEach((err) => {
              // Add scoped report details and send to Sentry
              Sentry.withScope((scope) => {
                // Annotate whether failing operation was query/mutation/subscription
                scope.setTag('kind', ctx.operation?.operation);
                // Log query and variables as extras
                // (make sure to strip out sensitive data!)
                scope.setExtra('query', ctx.request.query);
                scope.setExtra('variables', ctx.request.variables);
                scope.setUser({ username: 'test' });
                if (err.path) {
                  // We can also add the path as breadcrumb
                  scope.addBreadcrumb({
                    category: 'query-path',
                    message: err.path.join(' > '),
                    // level: Sentry.Severity.Debug,
                  });
                }
                // eslint-disable-next-line no-param-reassign
                err.message = `${err.message} - ${ctx.operationName}`;
                Sentry.captureException(err);
              });
            });
          },
        }),
      },
      ApolloServerPluginCacheControl({ defaultMaxAge: 5 }),
    ],
    formatError: (formattedError) => {
      if (process.env.NODE_ENV !== 'production') return formattedError;
      if (formattedError.extensions?.code !== ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED) return formattedError;
      return {
        ...formattedError,
        message: "Your query doesn't match the schema. Try double-checking it!",
      };
    },
  });
  await server.start();

  app.use(
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: req.headers.authorization
          ? (jwt.verify(req.headers.authorization, process.env.JWT_PRIVATE_KEY) as IAuthorizedUser)
          : undefined,
        dataLoaders: {
          userDataLoader,
        },
      }),
    }),
  );
  await new Promise((resolve) => {
    if (process.env.NODE_ENV === 'test') {
      resolve(null);
      return;
    }
    httpServer.listen({ port: process.env.LOCALHOST_PORT }, () => resolve(null));
  });
  await connectMongoDB();
  logger.info('🚀 Server ready at http://localhost:4000');

  return app;
};

export default runServer;
