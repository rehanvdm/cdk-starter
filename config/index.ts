import { envToObject as apiEnvToObject } from "@backend/lambda/api/environment";

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

/** The test variables used for testing the API */
export type TestVariables = {
  backend: {
    api_url: string;
    lambdaApi: {
      env: Record<string, string>;
    };
  };
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

export type TestConfig = Record<Environment, TestVariables>;
export const testConfig: TestConfig = {
  dev: {
    backend: {
      api_url: "https://dhgql3qbtdwhbyk7326mk7g2te0pgcbr.lambda-url.us-east-1.on.aws",
      lambdaApi: {
        env: apiEnvToObject({
          ENVIRONMENT: config.dev.env,
          RANDOM_NUMBER_MIN: config.dev.randomNumberMin,
          RANDOM_NUMBER_MAX: config.dev.randomNumberMax,
        }),
      },
    },
  },
  stage: {
    backend: {
      api_url: "https://2n2lbqfmqgqqs4436oghjbkv540duqqa.lambda-url.us-east-1.on.aws",
      lambdaApi: {
        env: apiEnvToObject({
          ENVIRONMENT: config.stage.env,
          RANDOM_NUMBER_MIN: config.stage.randomNumberMin,
          RANDOM_NUMBER_MAX: config.stage.randomNumberMax,
        }),
      },
    },
  },
  prod: {
    backend: {
      api_url: "https://2n2lbqfmqgqqs4436oghjbkv540duqqa.lambda-url.us-east-1.on.aws",
      lambdaApi: {
        env: apiEnvToObject({
          ENVIRONMENT: config.prod.env,
          RANDOM_NUMBER_MIN: config.prod.randomNumberMin,
          RANDOM_NUMBER_MAX: config.prod.randomNumberMax,
        }),
      },
    },
  },
};
