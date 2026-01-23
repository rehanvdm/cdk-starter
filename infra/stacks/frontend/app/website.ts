import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { CachePolicy } from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import { fileURLToPath } from "url";
import { ExpressStack, ExpressStage } from "cdk-express-pipeline";
import { EnvironmentConfig } from "../../../config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type WebsiteStackProps = {
  /** API origin hostname for CloudFront to proxy /api/* requests */
  apiOrigin: string;
};

/**
 * WebsiteStack - CloudFront + S3 static website hosting
 *
 * Deployed to us-east-1 (required for CloudFront with ACM certificates)
 * Proxies /api/* requests to the API Lambda Function URL
 */
export class WebsiteStack extends ExpressStack {
  constructor(
    scope: Construct,
    id: string,
    stage: ExpressStage,
    stackProps: cdk.StackProps,
    config: EnvironmentConfig,
    props: WebsiteStackProps
  ) {
    super(scope, id, stage, {
      ...stackProps,
      crossRegionReferences: true, // Enable cross-region references from API stack
    });

    function name(resourceName: string): string {
      return `${id}-${resourceName}`;
    }

    const websiteBucket = new s3.Bucket(this, name("bucket"), {
      bucketName: name("bucket"),
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const websiteDist = new cloudfront.Distribution(this, name("dist"), {
      comment: name("dist"),
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.HttpOrigin(props.apiOrigin, {
            readTimeout: cdk.Duration.seconds(60),
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          compress: false,
          cachePolicy: CachePolicy.CACHING_DISABLED,
        },
      },
      defaultRootObject: "index.html",
    });

    new s3deploy.BucketDeployment(this, name("deploy"), {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../../../src/frontend/dist"))],
      destinationBucket: websiteBucket,
      distribution: websiteDist,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, name("CloudFrontURL"), {
      description: "Website URL",
      value: cdk.Fn.join("", ["https://", websiteDist.distributionDomainName]),
    });
    new cdk.CfnOutput(this, name("APIURL"), {
      description: "API URL (via CloudFront)",
      value: cdk.Fn.join("", ["https://", websiteDist.distributionDomainName, "/api/"]),
    });
  }
}

export default WebsiteStack;
