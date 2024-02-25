import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpMethod } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { ApiEnv, envToObject as apiEnvToObject } from "@backend/lambda/api/environment";
import { EnvironmentConfig } from "@config/index";

export class Backend extends cdk.Stack {
  public readonly apiOrigin: string;

  constructor(scope: Construct, id: string, stackProps: cdk.StackProps, config: EnvironmentConfig) {
    super(scope, id, stackProps);

    function name(name: string): string {
      return id + "-" + name;
    }

    const apiEnv: ApiEnv = {
      ENVIRONMENT: config.env,
      RANDOM_NUMBER_MIN: config.randomNumberMin,
      RANDOM_NUMBER_MAX: config.randomNumberMax,
    };

    const apiLambda = new lambda.Function(this, name("lambda-api"), {
      functionName: name("api"),
      code: new lambda.AssetCode("dist/backend/lambda/api/"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(5),
      memorySize: 1024,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        NODE_OPTIONS: "--enable-source-maps",
        ...apiEnvToObject(apiEnv),
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
    new cdk.CfnOutput(this, "Lambda API Host", { value: apiLambdaUrl.url });
    new cdk.CfnOutput(this, "Lambda API Origin", { value: this.apiOrigin });
  }
}

export default Backend;
