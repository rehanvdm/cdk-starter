import { z } from "zod";

const CronEnvSchema = z.object({
  ENVIRONMENT: z.enum(["dev", "stage", "prod"]),
  RANDOM_NUMBER_MIN: z.string().transform((val) => parseInt(val)),
  RANDOM_NUMBER_MAX: z.string().transform((val) => parseInt(val)),
});
export type CronEnv = z.infer<typeof CronEnvSchema>;

let env: CronEnv | undefined;
export function getEnv(useCache = true): CronEnv {
  if (!useCache || !env) {
    env = CronEnvSchema.parse(process.env);
  }
  return env;
}
