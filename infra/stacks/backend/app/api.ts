import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpMethod } from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Duration } from "aws-cdk-lib";
import * as path from "path";
import { fileURLToPath } from "url";
import { ExpressStack, ExpressStage } from "cdk-express-pipeline";
import { EnvironmentConfig } from "../../../config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ApiStackProps = {};

export class ApiStack extends ExpressStack {
  /** The API origin (hostname) for CloudFront to proxy to */
  public readonly apiOrigin: string;

  constructor(
    scope: Construct,
    id: string,
    stage: ExpressStage,
    stackProps: cdk.StackProps,
    config: EnvironmentConfig,
    props?: ApiStackProps
  ) {
    super(scope, id, stage, {
      ...stackProps,
      crossRegionReferences: true, // Enable cross-region references for Website stack
    });

    function name(resourceName: string): string {
      return `${id}-${resourceName}`;
    }

    const apiEnv = {
      ENVIRONMENT: config.env,
      RANDOM_NUMBER_MIN: config.randomNumberMin.toString(),
      RANDOM_NUMBER_MAX: config.randomNumberMax.toString(),
    };

    const apiLambda = new lambda.Function(this, name("lambda"), {
      functionName: name("fn"),
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../../src/backend/api/dist")),
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

    // Attach shared IAM policy from the Global stack
    const sharedS3ReadPolicy = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      name("shared-s3-read-policy"),
      config.sharedPolicyName
    );
    apiLambda.role?.addManagedPolicy(sharedS3ReadPolicy);

    const apiLambdaUrl = apiLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: [HttpMethod.ALL],
      },
    });

    this.apiOrigin = cdk.Fn.select(2, cdk.Fn.split("/", apiLambdaUrl.url));

    new cdk.CfnOutput(this, name("ApiOrigin"), {
      description: "Lambda API Function URL origin",
      value: this.apiOrigin,
    });
  }
}

export default ApiStack;
