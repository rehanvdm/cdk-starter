import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpMethod } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";
import { fileURLToPath } from "url";
import { EnvironmentConfig } from "../config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Backend extends cdk.Stack {
  public readonly apiOrigin: string;

  constructor(scope: Construct, id: string, stackProps: cdk.StackProps, config: EnvironmentConfig) {
    super(scope, id, stackProps);

    function name(name: string): string {
      return id + "-" + name;
    }

    const apiEnv = {
      ENVIRONMENT: config.env,
      RANDOM_NUMBER_MIN: config.randomNumberMin.toString(),
      RANDOM_NUMBER_MAX: config.randomNumberMax.toString(),
    };

    const apiLambda = new lambda.Function(this, name("lambda-api"), {
      functionName: name("api"),
      code: lambda.Code.fromAsset(path.join(__dirname, "../../src/backend/api/dist")),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(5),
      memorySize: 1024,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        NODE_OPTIONS: "--enable-source-maps",
        ...apiEnv,
      },
    });

    const apiLambdaUrl = apiLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: [HttpMethod.ALL],
      },
    });

    this.apiOrigin = cdk.Fn.select(2, cdk.Fn.split("/", apiLambdaUrl.url));


    const cronEnv = {
      ENVIRONMENT: config.env,
      RANDOM_NUMBER_MIN: config.randomNumberMin.toString(),
      RANDOM_NUMBER_MAX: config.randomNumberMax.toString(),
    };
    const cronLambda = new lambda.Function(this, name("lambda-cron"), {
      functionName: name("cron"),
      code: lambda.Code.fromAsset(path.join(__dirname, "../../src/backend/cron/dist")),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        NODE_OPTIONS: "--enable-source-maps",
        ...cronEnv,
      },
    });
    const cronRule = new events.Rule(this, name("cron-rule"), {
      ruleName: name("daily-cron"),
      schedule: events.Schedule.rate(Duration.days(1)),
      description: "Daily cron job to log random number",
    });
    cronRule.addTarget(new targets.LambdaFunction(cronLambda));

    new cdk.CfnOutput(this, "Lambda API Host", { value: apiLambdaUrl.url });
    new cdk.CfnOutput(this, "Lambda API Origin", { value: this.apiOrigin });
    new cdk.CfnOutput(this, "Cron Lambda ARN", { value: cronLambda.functionArn });
  }
}

export default Backend;
