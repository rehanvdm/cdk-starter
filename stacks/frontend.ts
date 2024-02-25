import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { CachePolicy } from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import { EnvironmentConfig } from "@config/index";

export type FrontendProps = {
  apiOrigin: string;
};

export class Frontend extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    stackProps: cdk.StackProps,
    config: EnvironmentConfig,
    props: FrontendProps
  ) {
    super(scope, id, stackProps);

    function name(name: string): string {
      return id + "-" + name;
    }

    const frontendBucket = new s3.Bucket(this, name("web-bucket"), {
      bucketName: name("web-bucket"),
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const frontendDist = new cloudfront.Distribution(this, name("web-dist"), {
      comment: name("web-dist"),
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
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

    new s3deploy.BucketDeployment(this, name("deploy-with-invalidation"), {
      sources: [s3deploy.Source.asset(path.join(__dirname, "dist/frontend"))],
      destinationBucket: frontendBucket,
      distribution: frontendDist,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, name("CloudFrontURL"), {
      description: "Frontend Url",
      value: cdk.Fn.join("", ["https://", frontendDist.distributionDomainName]),
    });
    new cdk.CfnOutput(this, name("APIURL"), {
      description: "Api Url",
      value: cdk.Fn.join("", ["https://", frontendDist.distributionDomainName, "/api/"]),
    });
  }
}

export default Frontend;
