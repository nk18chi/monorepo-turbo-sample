/* eslint-disable no-console */
import * as ReadonlyArray from 'fp-ts/ReadonlyArray';
import { pipe } from 'fp-ts/function';
import { chain, fold } from 'fp-ts/Either';
import { Email } from '../../objects/Email.object';
import { Email as EmailFpTs } from '../../objects/Email.object.fp-ts';
import { Resolvers } from '../types';

const fpResolver: Resolvers = {
  Query: {
    fpts: async () => {
      const arr = ReadonlyArray.makeBy(5, (i) => i);
      console.log(arr);

      pipe(
        EmailFpTs('aaa@example.com'),
        chain(() => EmailFpTs('bbb@example.com')),
        fold(
          (error) => console.error(error),
          (email) => console.log(email),
        ),
      );

      pipe(
        EmailFpTs('aaa@example.com'),
        chain(() => EmailFpTs('b')),
        fold(
          (error) => console.error(error),
          (email) => console.log(email),
        ),
      );
      return true;
    },
    neverthrow: async () => {
      Email('aaa@example.com')
        .andThen(() => Email('bbb@example.com'))
        .match(console.log, console.error);
      Email('aaa@example.com')
        .andThen(() => Email('aaa'))
        .match(console.log, console.error);

      return true;
    },
  },
};

export default fpResolver;
