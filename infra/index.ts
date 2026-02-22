import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { CdkExpressPipeline, GitHubWorkflowConfig, JsonPatch } from "cdk-express-pipeline";
import { config, Environment } from "./config";
import Backend from "./stacks/backend";
import { Frontend } from "./stacks/frontend";

const app = new cdk.App();

async function Main() {
  const env = app.node.tryGetContext("env") as Environment;
  console.assert(env, "`-c env=` is required where `env` is one of `dev`, `stage`, or `prod`");
  console.log("Env", env);
  const envConfig = config[env];

  const awsEnv = {
    account: envConfig.aws.account,
    region: envConfig.aws.region,
  };

  // ============================================================================
  // CDK Express Pipeline Setup
  // ============================================================================

  const expressPipeline = new CdkExpressPipeline();

  const backendWave = expressPipeline.addWave("backend");
  const backendAppStage = backendWave.addStage("app");
  const backend = new Backend(app, "api-" + envConfig.env, backendAppStage, { env: awsEnv }, envConfig);

  const frontendWave = expressPipeline.addWave("frontend");
  const frontendAppStage = frontendWave.addStage("app");
  new Frontend(app, "website-" + envConfig.env, frontendAppStage, { env: awsEnv }, envConfig, {
    apiOrigin: backend.apiOrigin,
  });

  cdk.Tags.of(app).add("project", "cdk-starter");

  // Synthesize the pipeline
  expressPipeline.synth([backendWave, frontendWave], true, {});

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
        synth: `pnpm build && pnpm cdk synth '**' -c env=${targetEnv} --output=cdk.out/${targetEnv}`,
        diff: `pnpm cdk diff {stackSelector} --app=cdk.out/${targetEnv}`,
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
      assumeRoleArn: envConfig.aws.githubDeployRoleArn,
      assumeRegion: envConfig.aws.region,
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
      assumeRoleArn: envConfig.aws.githubDeployRoleArn,
      assumeRegion: envConfig.aws.region,
      commands: {
        [targetEnv]: {
          synth: `pnpm build && pnpm cdk synth '**' -c env=${targetEnv} --output=cdk.out/${targetEnv}`,
          deploy: `pnpm cdk deploy {stackSelector} --app=cdk.out/${targetEnv} --concurrency 10 --require-approval never --exclusively`,
        },
      },
    };
  }

  const ghConfig: GitHubWorkflowConfig = {
    directory: path.join(__dirname, "..", ".github"),
    workingDirectory: "infra",
    buildConfig: {
      type: "preset-pnpm",
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

  // Generate workflows without saving to apply customizations
  const ghWorkflows = expressPipeline.generateGitHubWorkflows(ghConfig);
}

Main().catch((err) => {
  console.error(err);
  process.exit(1);
});
