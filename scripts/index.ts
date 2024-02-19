import * as path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as esbuild from "esbuild";
import execa from "execa";
import { config, environments, Environment } from "@config/index";

const baseDir = "../";
const paths = {
  workingDir: path.resolve(__dirname, baseDir),
  src: path.resolve(__dirname, baseDir, "src"),
  srcBackend: path.resolve(__dirname, baseDir, "src", "backend"),
  dist: path.resolve(__dirname, baseDir, "dist"),
  distBackend: path.resolve(__dirname, baseDir, "dist", "backend"),
};

async function runCommand(
  command: string,
  args: string[] | string,
  options: execa.Options<string> = {},
  echoCommand: boolean = true,
  exitProcessOnError: boolean = true
) {
  if (!Array.isArray(args)) args = args.split(" ");

  if (echoCommand) console.log("> Running:", command, args.join(" "));

  const resp = await execa(command, args, {
    ...options,
    preferLocal: true,
    reject: false,
  });

  if (resp.exitCode !== 0) {
    if (exitProcessOnError) {
      console.error(resp.stderr || resp.stdout);
      process.exit(1);
    } else throw new Error(resp.stderr || resp.stdout);
  }

  console.log(resp.stdout);
}

const commands = ["validate", "build-src", "cdk"] as const;
export type Command = (typeof commands)[number];

const argv = yargs(hideBin(process.argv))
  .option("command", {
    alias: "c",
    describe: "the command you want to run",
    choices: commands,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .demandOption(["c"]).argv as any;

(async () => {
  const command = argv.c as Command;
  switch (command) {
    case "validate":
      await validate();
      break;
    case "build-src":
      await buildTsLambdas();
      break;

    case "cdk":
      const cdkArgs = yargs(hideBin(process.argv))
        .option("operation", {
          alias: "o",
          describe: "the cdk operation you want to run",
          choices: ["diff", "deploy", "hotswap"],
        })
        .option("environment", {
          alias: "e",
          describe: "the environment you want to run the command in",
          choices: environments,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .demandOption(["o", "e"]).argv as any;

      const environment = cdkArgs.e as keyof typeof config;
      const cdkOperation = cdkArgs.o as "diff" | "deploy" | "hotswap";

      await cdkCommand(cdkOperation, environment);
      break;
    default:
      throw new Error("Unknown command: " + command);
  }
})();

async function validate() {
  await runCommand("tsc", ["--noEmit"], { cwd: paths.workingDir });
  await runCommand("eslint", ["**/*.ts", "--ignore-pattern", "'**/*.d.ts'", "--fix"], { cwd: paths.workingDir });
}

async function buildTsLambdas() {
  console.log("BUILDING TS LAMBDAS");

  const tsLambdaDirectories = ["lambda/api"];

  for (const lambdaDir of tsLambdaDirectories) {
    const fullLambdaDir = path.join(paths.srcBackend, lambdaDir);
    const pathTs = path.join(fullLambdaDir, "index.ts");
    const pathJs = path.join(paths.distBackend, lambdaDir, "index.js");

    await esbuild.build({
      platform: "node",
      target: ["esnext"],
      minify: true,
      bundle: true,
      keepNames: true,
      sourcemap: "linked",
      sourcesContent: false,
      entryPoints: [pathTs],
      outfile: pathJs,
      external: [""],
      logLevel: "warning",
      metafile: true,
    });
  }

  console.log("LAMBDAS TS BUILD");
}

async function cdkCommand(command: "diff" | "deploy" | "hotswap", environment: Environment) {
  let extraArgs = "--context env=" + environment;
  if (command === "deploy" || command === "hotswap") extraArgs += " --require-approval never";
  if (command === "hotswap") {
    command = "deploy";
    extraArgs += " --hotswap";
  }

  await runCommand("cdk", `${command} "**" --profile ${config[environment].aws.profile} ${extraArgs}`, {
    cwd: paths.workingDir,
    stdout: "inherit",
    stderr: "inherit",
  });
}
