import { Result, ok, err } from 'neverthrow';
import { Newtype, iso } from 'newtype-ts';
import { z } from 'zod';
import { type ValidationError, fromZodError } from 'zod-validation-error';

export type Email = Newtype<{ readonly Email: unique symbol }, string>;

const EmailSchema = z.string().email('This is not a valid email.');

export function Email(email: string): Result<Email, ValidationError> {
  const result = EmailSchema.safeParse(email);

  if (!result.success) {
    return err(fromZodError(result.error));
  }

  return ok(iso<Email>().wrap(email));
}
