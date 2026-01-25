import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Duration } from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";
import { fileURLToPath } from "url";
import { ExpressStack, ExpressStage } from "cdk-express-pipeline";
import { EnvironmentConfig } from "../../../config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type CronStackProps = {};

export class CronStack extends ExpressStack {
  constructor(
    scope: Construct,
    id: string,
    stage: ExpressStage,
    stackProps: cdk.StackProps,
    config: EnvironmentConfig,
    props?: CronStackProps
  ) {
    super(scope, id, stage, stackProps);

    function name(resourceName: string): string {
      return `${id}-${resourceName}`;
    }

    const cronEnv = {
      ENVIRONMENT: config.env,
      RANDOM_NUMBER_MIN: config.randomNumberMin.toString(),
      RANDOM_NUMBER_MAX: config.randomNumberMax.toString(),
    };

    const cronLambda = new lambda.Function(this, name("lambda"), {
      functionName: name("fn"),
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../../src/backend/cron/dist")),
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

    // Attach shared IAM policy from the Global stack
    const sharedS3ReadPolicy = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      name("shared-s3-read-policy"),
      config.sharedPolicyName
    );
    cronLambda.role?.addManagedPolicy(sharedS3ReadPolicy);

    const cronRule = new events.Rule(this, name("rule"), {
      ruleName: name("daily"),
      schedule: events.Schedule.rate(Duration.days(1)),
      description: "Daily cron job to log random number",
    });
    cronRule.addTarget(new targets.LambdaFunction(cronLambda));
  }
}

export default CronStack;
