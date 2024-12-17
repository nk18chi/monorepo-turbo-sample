import { expect, test, describe, vi, beforeEach } from 'vitest';
import request from 'supertest';
import runServer from './server';
import { GQL_QUERY_GET_USERS } from './graphql/gql/User.gql';
import logger from './config/logger';
import User from './repositories/user/User.schema';

vi.mock('./config/logger');
vi.mock('./mongo/connect');
describe('e2e: server.ts', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.spyOn(User, 'find').mockResolvedValue([]);
  });
  describe('graphql-query-complexity', async () => {
    test('should throw error when complexity is greater than MAX_COMPLEXITY', async () => {
      vi.stubEnv('GRAPHQL_QUERY_MAX_COMPLEXITY', '5');
      const testApp = await runServer();
      const res = await request(testApp).post('/graphql').send({
        query: GQL_QUERY_GET_USERS,
      });
      expect(res.body.errors[0].message).toBe(
        'Sorry, too complicated query! 7 exceeded the maximum allowed complexity of 5 by Users',
      );
    });

    test('should log when complexity is less than MAX_COMPLEXITY', async () => {
      const testApp = await runServer();
      await request(testApp).post('/graphql').send({
        query: GQL_QUERY_GET_USERS,
      });
      expect(logger.info).toHaveBeenCalledWith('Used query complexity points: 7 by Users');
    });

    test('should skip introspection query', async () => {
      const testApp = await runServer();
      const res = await request(testApp)
        .post('/graphql')
        .send({
          query: `query IntrospectionQuery {
            __schema {
              types {
                name
              }
            }
          }`,
        });
      expect(res.body.errors?.[0]?.message).not.toBeDefined();
      expect(logger.info).not.toHaveBeenCalledWith('Used query complexity points: 0 by IntrospectionQuery');
    });
    test('should return throw detailed graphql error in development when a query is wrong', async () => {
      vi.stubEnv('LOCALHOST_PORT', '4001');
      vi.stubEnv('NODE_ENV', 'development');
      const testApp = await runServer();
      const res = await request(testApp)
        .post('/graphql')
        .send({
          query: `query IntrospectionQuery {
            __schema {
              typess {
                name
              }
            }
          }`,
        });
      expect(res.body.errors[0].message).toBe('Cannot query field "typess" on type "__Schema". Did you mean "types"?');
    });
    test('should return throw detailed graphql error in production if a graphql query is fine', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('LOCALHOST_PORT', '4002');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(User, 'find').mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('MongoError')) } as any);
      const testApp = await runServer();
      const res = await request(testApp).post('/graphql').send({
        query: GQL_QUERY_GET_USERS,
      });
      expect(res.body.errors[0].message).toBe('MongoError');
    });
    test('should override error message in production when a query is wrong', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('LOCALHOST_PORT', '4003');
      const testApp = await runServer();
      const res = await request(testApp)
        .post('/graphql')
        .send({
          query: `query IntrospectionQuery {
            __schema {
              typesss {
                name
              }
            }
          }`,
        });
      expect(res.body.errors[0].message).toBe("Your query doesn't match the schema. Try double-checking it!");
    });
  });
});
