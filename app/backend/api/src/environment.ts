import { z } from "zod";

const ApiEnvSchema = z.object({
  ENVIRONMENT: z.enum(["dev", "stage", "prod"]),
  RANDOM_NUMBER_MIN: z.string().transform((val) => parseInt(val)),
  RANDOM_NUMBER_MAX: z.string().transform((val) => parseInt(val)),
});
export type ApiEnv = z.infer<typeof ApiEnvSchema>;

/* Cache for reuse in Lambda */
let env: ApiEnv;

/** Parse and validate the environment variables */
export function getEnv(): ApiEnv {
  /* Do not use cache env if testing */
  if (!env || process.env.TEST) env = ApiEnvSchema.parse(process.env);

  return ApiEnvSchema.parse(process.env);
}

/** Convert the environment variables to a string object */
export function envToObject(env: ApiEnv): Record<string, string> {
  return {
    ENVIRONMENT: env.ENVIRONMENT,
    RANDOM_NUMBER_MIN: env.RANDOM_NUMBER_MIN.toString(),
    RANDOM_NUMBER_MAX: env.RANDOM_NUMBER_MAX.toString(),
  };
}
