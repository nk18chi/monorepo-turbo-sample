import { Either, left, right } from 'fp-ts/lib/Either';
import { Newtype, iso } from 'newtype-ts';
import { z } from 'zod';
import { type ValidationError, fromZodError } from 'zod-validation-error';

export type Email = Newtype<{ readonly Email: unique symbol }, string>;

const EmailSchema = z.string().email('This is not a valid email.');

export function Email(email: string): Either<ValidationError, Email> {
  const result = EmailSchema.safeParse(email);

  if (!result.success) {
    return left(fromZodError(result.error));
  }

  return right(iso<Email>().wrap(email));
}
