import { describe, expect, it, beforeEach } from "vitest";
import { handler } from "./index";
import { getEnv } from "./environment";
import type { APIGatewayProxyEventV2, Context } from "aws-lambda";

function createMockEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/",
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
    },
    requestContext: {
      accountId: "anonymous",
      apiId: "test",
      domainName: "test.lambda-url.us-east-1.on.aws",
      domainPrefix: "test",
      http: {
        method: "GET",
        path: "/",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "test",
      },
      requestId: "test-request-id",
      routeKey: "$default",
      stage: "$default",
      time: "01/Jan/2024:00:00:00 +0000",
      timeEpoch: 1704067200000,
    },
    isBase64Encoded: false,
    ...overrides,
  };
}

function createMockContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "test-function",
    functionVersion: "1",
    invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:test",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/test",
    logStreamName: "2024/01/01/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
}

describe("API Lambda Handler", () => {
  beforeEach(() => {
    process.env.ENVIRONMENT = "dev";
    process.env.RANDOM_NUMBER_MIN = "1";
    process.env.RANDOM_NUMBER_MAX = "100";
    getEnv(false); // Force fresh parse to update cache with test env vars
  });

  it("should return 200 status code", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler(event, context);

    expect(result.statusCode).toBe(200);
  });

  it("should return HTML content type", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler(event, context);

    expect(result.headers?.["Content-Type"]).toBe("text/html");
  });

  it("should include Hello World in body", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler(event, context);

    expect(result.body).toContain("Hello World!");
  });

  it("should include environment name in body", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler(event, context);

    expect(result.body).toContain("dev");
  });

  it("should include a random number in the body", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler(event, context);

    // Body format: "Hello World! - dev - 42"
    const parts = result.body.split(" - ");
    const randomNumber = parseInt(parts[2]);

    expect(randomNumber).toBeGreaterThanOrEqual(1);
    expect(randomNumber).toBeLessThanOrEqual(100);
  });
});
