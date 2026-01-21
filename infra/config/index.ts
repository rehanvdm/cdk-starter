/** Available Environments */
export const environments = ["dev", "stage", "prod"] as const;
export type Environment = (typeof environments)[number];

/** The AWS Environment details */
export type AwsEnvironment = {
  /** AWS region to deploy to */
  region: string;
  /** AWS account to deploy to */
  account: string;
  /** AWS profile to deploy with */
  profile: string;
};

export type EnvironmentConfig = {
  env: Environment;
  aws: AwsEnvironment;
  randomNumberMin: number;
  randomNumberMax: number;
};
export type Config = Record<Environment, EnvironmentConfig>;

export const config: Config = {
  dev: {
    env: "dev",
    aws: {
      region: "us-east-1",
      account: "581184285249",
      profile: "rehan-demo-exported",
    },
    randomNumberMin: 1,
    randomNumberMax: 100,
  },
  stage: {
    env: "stage",
    aws: {
      region: "us-east-1",
      account: "581184285249",
      profile: "rehan-demo-exported",
    },
    randomNumberMin: 50,
    randomNumberMax: 100,
  },
  prod: {
    env: "prod",
    aws: {
      region: "us-east-1",
      account: "581184285249",
      profile: "rehan-demo-exported",
    },
    randomNumberMin: 100,
    randomNumberMax: 1000,
  },
};
