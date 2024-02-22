import { config, Environment } from "@config/index";
import * as cdk from "aws-cdk-lib";
import Backend from "./stacks/backend";
import { Frontend } from "./stacks/frontend";

const app = new cdk.App();

async function Main() {
  const env = app.node.tryGetContext("env") as Environment;
  console.assert(env, "`--context env=` is required where `env` is one of `dev`, `stage`, or `prod`");
  console.log("Env", env);
  const envConfig = config[env];

  const awsEnv = {
    account: envConfig.aws.account,
    region: envConfig.aws.region,
  };
  const backend = new Backend(app, "starter-backend-" + envConfig.env, { env: awsEnv }, envConfig);

  new Frontend(app, "starter-frontend-" + envConfig.env, { env: awsEnv }, envConfig, {
    apiOrigin: backend.apiOrigin,
  });

  cdk.Tags.of(app).add("blog", "starter-backend");
  app.synth();
}

Main().catch((err) => {
  console.error(err);
  process.exit(1);
});
