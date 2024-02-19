import { config, Environment } from "@config/index";
import * as cdk from "aws-cdk-lib";
import Backend from "./stacks/backend";

const app = new cdk.App();

async function Main() {
  const env = app.node.tryGetContext("env") as Environment;
  console.assert(
    env,
    "`--context env=` is required where `env` is one of `dev`, `stage`, or `prod`",
  );
  console.log("Env", env);
  const envConfig = config[env];

  new Backend(
    app,
    "starter-backend",
    {
      env: {
        account: envConfig.aws.account,
        region: envConfig.aws.region,
      },
    },
    envConfig,
  );

  cdk.Tags.of(app).add("blog", "starter-backend");
  app.synth();
}

Main().catch((err) => {
  console.error(err);
  process.exit(1);
});
