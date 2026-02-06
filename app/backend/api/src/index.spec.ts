import { describe, expect, it, beforeEach } from "vitest";
import { handler } from "./index";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";

type ApiGwEventOptions = {
  method: "GET" | "POST" | "OPTIONS" | "PUT" | "DELETE" | "PATCH";
  path: string;
  contentType?: string;
  pathParameters?: { [name: string]: string | undefined };
  queryStringParameters?: { [name: string]: string | undefined };
  headers?: { [name: string]: string };
  body?: string;
  origin?: string;
  ip?: string;
  ua?: string;
};

function apiGwContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "mocked",
    functionVersion: "mocked",
    invokedFunctionArn: "mocked",
    memoryLimitInMB: "mocked",
    awsRequestId: "mocked",
    logGroupName: "mocked",
    logStreamName: "mocked",
    getRemainingTimeInMillis(): number {
      return 999;
    },
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as Context;
}
function apiGwEventV2(opts: ApiGwEventOptions): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    body: opts.body || undefined,
    rawPath: opts.path,
    rawQueryString: "",
    queryStringParameters: opts.queryStringParameters,
    pathParameters: opts.pathParameters,
    headers: {
      "x-amzn-tls-cipher-suite": "ECDHE-RSA-AES128-GCM-SHA256",
      "x-amzn-tls-version": "TLSv1.2",
      "x-amzn-trace-id": "Root=1-63f1bdf2-7dc6e1bb7f6b429b5380582b",
      "x-forwarded-proto": "https",
      origin: opts.origin || "",
      "x-forwarded-port": "443",
      "x-amz-cf-id": "FBw78cV1ocjog1mSm3hAzQAAVpOPqzXnPVdX5q0fIqvTXIjs2WS55Q==",
      via: "2.0 1db4ab20ef3897e534041f147e869cca.cloudfront.net (CloudFront)",
      "x-forwarded-for": opts.ip || "",
      "user-agent": opts.ua || "",
      "content-type": opts.contentType || "application/json",
      ...opts.headers,
    },
    requestContext: {
      accountId: "anonymous",
      apiId: "wgww7os4xwv5bquomdbplkn4gi0hwlmo",
      domainName: "wgww7os4xwv5bquomdbplkn4gi0hwlmo.lambda-url.us-east-1.on.aws",
      domainPrefix: "wgww7os4xwv5bquomdbplkn4gi0hwlmo",
      http: {
        method: opts.method,
        path: opts.path,
        protocol: "HTTP/1.1",
        sourceIp: opts.ip || "",
        userAgent: opts.ua || "",
      },
      requestId: "9cd26b7a-e51f-48ae-b926-0f6580e66cdd",
      routeKey: "$default",
      stage: "$default",
      time: "19/Feb/2023:06:13:07 +0000",
      timeEpoch: 1676787187031,
    },
    isBase64Encoded: false,
  };
}

describe("Backend API Handler", () => {
  beforeEach(() => {
    // Set up environment variables for testing
    process.env.ENVIRONMENT = "dev";
    process.env.RANDOM_NUMBER_MIN = "1";
    process.env.RANDOM_NUMBER_MAX = "10";
  });

  it("should return 200 status code and Hello World message", async () => {
    const context = apiGwContext();
    const event = apiGwEventV2({
      method: "GET",
      path: "/",
      body: "",
      origin: "https://example.com",
    });

    const response = await handler(event, context);

    expect(response.statusCode).toBe(200);
    expect(response.headers?.["Content-Type"]).toBe("text/html");
    expect(response.body).toContain("Hello World!");
    expect(response.body).toContain("dev"); // Should contain environment name
  });

  it("should include random number in response", async () => {
    const context = apiGwContext();
    const event = apiGwEventV2({
      method: "GET",
      path: "/",
      body: "",
    });

    const response = await handler(event, context);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatch(/Hello World! - dev - \d+/);
  });
});

