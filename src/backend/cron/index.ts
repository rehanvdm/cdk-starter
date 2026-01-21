import { ScheduledEvent, Context } from "aws-lambda";
import { getEnv } from "./environment";
import { getRandomNumberBetween } from "@app/utils";

export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  console.log("Cron job triggered", {
    time: event.time,
    requestId: context.awsRequestId,
  });

  const env = getEnv();
  console.log("Environment:", env.ENVIRONMENT);

  const randomNumber = getRandomNumberBetween(env.RANDOM_NUMBER_MIN, env.RANDOM_NUMBER_MAX);
  console.log("Generated random number:", randomNumber);

  // Log a summary for CloudWatch
  console.log(
    JSON.stringify({
      type: "CRON_EXECUTION",
      environment: env.ENVIRONMENT,
      randomNumber,
      timestamp: new Date().toISOString(),
    })
  );
};
