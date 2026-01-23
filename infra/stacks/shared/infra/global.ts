import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { ExpressStack, ExpressStage } from "cdk-express-pipeline";
import { EnvironmentConfig } from "../../../config";

export class GlobalStack extends ExpressStack {
  constructor(
    scope: Construct,
    id: string,
    stage: ExpressStage,
    stackProps: cdk.StackProps,
    config: EnvironmentConfig
  ) {
    super(scope, id, stage, stackProps);

    new iam.ManagedPolicy(this, `${id}-s3-read-policy`, {
      managedPolicyName: config.sharedPolicyName,
      description: "Shared policy allowing S3 GetObject access - attach to Lambda roles",
      statements: [
        new iam.PolicyStatement({
          sid: "AllowS3GetObject",
          effect: iam.Effect.ALLOW,
          actions: ["s3:GetObject", "s3:ListBucket"],
          resources: ["*"], // In production, scope to specific buckets
        }),
      ],
    });
  }
}

export default GlobalStack;
