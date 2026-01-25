import { APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from "aws-lambda";
import { getEnv } from "./environment";
import { getRandomNumberBetween } from "@app/utils";

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResult> => {
  console.log("event", event);

  const env = getEnv();
  console.log("env", env);

  const randomNumber = getRandomNumberBetween(env.RANDOM_NUMBER_MIN, env.RANDOM_NUMBER_MAX);
  console.log("randomNumber", randomNumber);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: "Hello World! - " + env.ENVIRONMENT + " - " + randomNumber,
  };
};
