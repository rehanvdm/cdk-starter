import { config, Environment } from "./config";
import * as cdk from "aws-cdk-lib";
import { CdkExpressPipeline, GitHubWorkflowConfig, GithubWorkflowFile } from "cdk-express-pipeline";
import { GlobalStack } from "./stacks/shared/infra/global";
import { ApiStack } from "./stacks/backend/app/api";
import { CronStack } from "./stacks/backend/app/cron";
import { WebsiteStack } from "./stacks/frontend/app/website";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new cdk.App();

async function Main() {
  const env = app.node.tryGetContext("env") as Environment;
  console.assert(env, "`--context env=` is required where `env` is one of `dev`, `stage`, or `prod`");
  console.log("Environment:", env);
  const envConfig = config[env];

  const globalEnv = {
    account: envConfig.aws.account,
    region: envConfig.aws.globalRegion, // us-east-1
  };
  const primaryEnv = {
    account: envConfig.aws.account,
    region: envConfig.aws.primaryRegion, // eu-west-1
  };

  const pipeline = new CdkExpressPipeline();

  // ============================================================================
  // Wave 1: shared - Global infrastructure (us-east-1)
  // ============================================================================
  const sharedWave = pipeline.addWave("shared");
  const infraStage = sharedWave.addStage("infra");

  const globalStack = new GlobalStack(
    app,
    `starter-global-${envConfig.env}`,
    infraStage,
    { env: globalEnv },
    envConfig
  );

  // ============================================================================
  // Wave 2: backend - Application backend (eu-west-1)
  // ============================================================================
  const backendWave = pipeline.addWave("backend");
  const backendAppStage = backendWave.addStage("app");

  // Note: Cross-wave dependencies are handled automatically by wave ordering.
  // The shared wave deploys before backend wave, so globalStack resources
  // will be available when api/cron stacks deploy.
  const apiStack = new ApiStack(app, `starter-api-${envConfig.env}`, backendAppStage, { env: primaryEnv }, envConfig);
  new CronStack(app, `starter-cron-${envConfig.env}`, backendAppStage, { env: primaryEnv }, envConfig);

  // ============================================================================
  // Wave 3: frontend - Website hosting (eu-west-1)
  // ============================================================================
  const frontendWave = pipeline.addWave("frontend");
  const frontendAppStage = frontendWave.addStage("app");

  new WebsiteStack(app, `starter-website-${envConfig.env}`, frontendAppStage, { env: primaryEnv }, envConfig, {
    apiOrigin: apiStack.apiOrigin,
  });

  // Note: Cross-wave dependencies (website -> api) are handled by wave ordering.
  // The backend wave deploys before frontend wave.

  // ============================================================================
  // GitHub Workflow Generation
  // ============================================================================

  /**
   * Helper to create diff workflow configuration for a specific environment
   * @param id Workflow identifier (e.g., "dev", "stage", "prod")
   * @param branch Branch that triggers the diff (e.g., "develop", "stage", "main")
   * @param environments Environments to diff against (e.g., ["dev", "stage", "prod"])
   */
  function createDiffWorkflow(
    id: string,
    branch: string,
    environments: Environment[]
  ): GitHubWorkflowConfig["diff"][0] {
    const commands: Record<string, { synth: string; diff: string }> = {};

    for (const targetEnv of environments) {
      commands[targetEnv] = {
        synth: `pnpm --filter infra exec cdk synth '**' -c env=${targetEnv} --output=cdk.out/${targetEnv}`,
        diff: `pnpm --filter infra exec cdk diff {stackSelector} --app=cdk.out/${targetEnv}`,
      };
    }

    return {
      id,
      on: {
        pullRequest: {
          branches: [branch],
        },
      },
      stackSelector: "stage",
      assumeRoleArn: `arn:aws:iam::${envConfig.aws.account}:role/github-oidc-role`,
      assumeRegion: envConfig.aws.globalRegion,
      commands,
    };
  }

  /**
   * Helper to create deploy workflow configuration for a specific environment
   * @param id Workflow identifier (e.g., "dev", "stage", "prod")
   * @param branch Branch that triggers deployment (e.g., "develop", "stage", "main")
   * @param targetEnv Environment to deploy to
   */
  function createDeployWorkflow(id: string, branch: string, targetEnv: Environment): GitHubWorkflowConfig["deploy"][0] {
    return {
      id,
      on: {
        push: {
          branches: [branch],
        },
      },
      stackSelector: "stack",
      assumeRoleArn: `arn:aws:iam::${envConfig.aws.account}:role/github-oidc-role`,
      assumeRegion: envConfig.aws.globalRegion,
      commands: {
        [targetEnv]: {
          synth: `pnpm --filter infra exec cdk synth '**' -c env=${targetEnv} --output=cdk.out/${targetEnv}`,
          deploy: `pnpm --filter infra exec cdk deploy {stackSelector} --app=cdk.out/${targetEnv} --concurrency 10 --require-approval never --exclusively`,
        },
      },
    };
  }

  const ghConfig: GitHubWorkflowConfig = {
    directory: path.join(__dirname, "..", ".github"),
    buildConfig: {
      type: "workflow",
      workflow: {
        path: ".github/actions/build",
      },
    },
    diff: [
      // PR to develop: diff dev, stage, prod
      createDiffWorkflow("dev", "develop", ["dev", "stage", "prod"]),
      // PR to stage: diff stage, prod
      createDiffWorkflow("stage", "stage", ["stage", "prod"]),
      // PR to main: diff prod only
      createDiffWorkflow("prod", "main", ["prod"]),
    ],
    deploy: [
      // Push to develop: deploy dev
      createDeployWorkflow("dev", "develop", "dev"),
      // Push to stage: deploy stage
      createDeployWorkflow("stage", "stage", "stage"),
      // Push to main: deploy prod
      createDeployWorkflow("prod", "main", "prod"),
    ],
  };

  // Synthesize the pipeline and generate GitHub workflows
  pipeline.synth([sharedWave, backendWave, frontendWave], true, {});
  pipeline.generateGitHubWorkflows(ghConfig, true);

  // Add tags to all resources
  cdk.Tags.of(app).add("project", "cdk-starter");
  cdk.Tags.of(app).add("environment", envConfig.env);

  app.synth();
}

Main().catch((err) => {
  console.error(err);
  process.exit(1);
});
