import { describe, expect, it, beforeEach, vi } from "vitest";
import { handler } from "./index";
import { getEnv } from "./environment";
import type { ScheduledEvent, Context } from "aws-lambda";

function createMockEvent(): ScheduledEvent {
  return {
    version: "0",
    id: "test-event-id",
    "detail-type": "Scheduled Event",
    source: "aws.events",
    account: "123456789012",
    time: "2024-01-01T00:00:00Z",
    region: "us-east-1",
    resources: ["arn:aws:events:us-east-1:123456789012:rule/test-rule"],
    detail: {},
  };
}

function createMockContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "test-cron-function",
    functionVersion: "1",
    invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:test-cron",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/test-cron",
    logStreamName: "2024/01/01/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
}

describe("Cron Lambda Handler", () => {
  beforeEach(() => {
    process.env.ENVIRONMENT = "dev";
    process.env.RANDOM_NUMBER_MIN = "1";
    process.env.RANDOM_NUMBER_MAX = "100";
    getEnv(false); // Force fresh parse to update cache with test env vars
  });

  it("should execute without throwing", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    await expect(handler(event, context)).resolves.not.toThrow();
  });

  it("should log a JSON summary with CRON_EXECUTION type", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const event = createMockEvent();
    const context = createMockContext();

    await handler(event, context);

    const jsonLogCall = consoleSpy.mock.calls.find((call) => {
      try {
        const parsed = JSON.parse(call[0] as string);
        return parsed.type === "CRON_EXECUTION";
      } catch {
        return false;
      }
    });

    expect(jsonLogCall).toBeDefined();
    const logData = JSON.parse(jsonLogCall![0] as string);
    expect(logData.environment).toBe("dev");
    expect(typeof logData.randomNumber).toBe("number");
    expect(logData.timestamp).toBeDefined();

    consoleSpy.mockRestore();
  });
});
