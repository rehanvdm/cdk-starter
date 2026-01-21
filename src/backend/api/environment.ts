import { z } from "zod";

const ApiEnvSchema = z.object({
  ENVIRONMENT: z.enum(["dev", "stage", "prod"]),
  RANDOM_NUMBER_MIN: z.string().transform((val) => parseInt(val)),
  RANDOM_NUMBER_MAX: z.string().transform((val) => parseInt(val)),
});
export type ApiEnv = z.infer<typeof ApiEnvSchema>;

let env: ApiEnv | undefined;
export function getEnv(useCache = true): ApiEnv {
  if (!useCache || !env) {
    env = ApiEnvSchema.parse(process.env);
  }
  return env;
}
