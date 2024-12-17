import mongoose from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { Newtype, iso } from 'newtype-ts';
import { z } from 'zod';
import { type ValidationError, fromZodError } from 'zod-validation-error';

export type MongoId = Newtype<{ readonly MongoId: unique symbol }, string>;

const MongoIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val));

export function MongoId(id: string): Result<MongoId, ValidationError> {
  const result = MongoIdSchema.safeParse(id);

  if (!result.success) {
    return err(fromZodError(result.error));
  }

  return ok(iso<MongoId>().wrap(id));
}
