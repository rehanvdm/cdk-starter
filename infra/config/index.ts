/** Available Environments */
export const environments = ["dev", "stage", "prod"] as const;
export type Environment = (typeof environments)[number];

/** AWS Region configuration */
export const GLOBAL_REGION = "us-east-1"; // For IAM, CloudFront, ACM certs
export const PRIMARY_REGION = "eu-west-1"; // Primary application region

/** The AWS Environment details */
export type AwsEnvironment = {
  /** Primary AWS region for application workloads */
  primaryRegion: string;
  /** Global AWS region for IAM, CloudFront, certificates */
  globalRegion: string;
  /** AWS account to deploy to */
  account: string;
  /** AWS profile to deploy with */
  profile: string;
  /** GitHub OIDC deploy role ARN */
  githubDeployRoleArn: string;
};

export type EnvironmentConfig = {
  env: Environment;
  aws: AwsEnvironment;
  randomNumberMin: number;
  randomNumberMax: number;
  // Resource created in teh global infra stack and "weakly" referenced in other stacks through importing by name
  sharedPolicyName: string;
};
export type Config = Record<Environment, EnvironmentConfig>;

export const config: Config = {
  dev: {
    env: "dev",
    aws: {
      primaryRegion: PRIMARY_REGION,
      globalRegion: GLOBAL_REGION,
      account: "581184285249",
      profile: "rehan-demo-exported",
      githubDeployRoleArn: "arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role",
    },
    randomNumberMin: 1,
    randomNumberMax: 100,
    sharedPolicyName: "dev-shared-s3-read",
  },
  stage: {
    env: "stage",
    aws: {
      primaryRegion: PRIMARY_REGION,
      globalRegion: GLOBAL_REGION,
      account: "581184285249",
      profile: "rehan-demo-exported",
      githubDeployRoleArn: "arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role",
    },
    randomNumberMin: 50,
    randomNumberMax: 100,
    sharedPolicyName: "stage-shared-s3-read",
  },
  prod: {
    env: "prod",
    aws: {
      primaryRegion: PRIMARY_REGION,
      globalRegion: GLOBAL_REGION,
      account: "581184285249",
      profile: "rehan-demo-exported",
      githubDeployRoleArn: "arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role",
    },
    randomNumberMin: 100,
    randomNumberMax: 1000,
    sharedPolicyName: "prod-shared-s3-read",
  },
};
