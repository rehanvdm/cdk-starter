import { APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from "aws-lambda";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import assert from "assert";

export function apiGwContext() {
  const apiGwContext: Context = {
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
    // done (error?: Error, result?: any): void {
    //
    // },
    // fail (error: Error | string): void {
    //
    // },
    // succeed (messageOrObject: any): void {
    //
    // }
  } as Context;
  return apiGwContext;
}

export type ApiGwEventOptions = {
  method: "GET" | "POST" | "OPTIONS";
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

export function apiGwEventV2(opts: ApiGwEventOptions): APIGatewayProxyEventV2 {
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

export function setEnvVariables(obj: Record<string, string>) {
  for (const [key, val] of Object.entries(obj)) {
    process.env[key] = val;
  }
}

export const TEST_TYPES = {
  UNIT: "UNIT",
  E2E: "E2E",
} as const;

export async function apiRequest(url: string, opts: ApiGwEventOptions): Promise<APIGatewayProxyResult> {
  let headers = {};
  if (opts.headers) {
    headers = opts.headers;
  }

  if (opts.origin) {
    headers = { ...headers, origin: opts.origin };
  }

  const options: AxiosRequestConfig = {
    method: opts.method,
    params: opts.queryStringParameters || undefined,
    data: opts.body ? JSON.parse(opts.body) : undefined,
    url: url + opts.path,
    // timeout: 30000,
    headers,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformResponse: (res: any) => {
      return res;
    } /* Do not parse json */,
  };

  console.log(JSON.stringify(options, null, 2));

  try {
    const res = await axios(options);
    return {
      statusCode: res.status,
      body: res.data,
      headers: res.headers as { [p: string]: string | number | boolean } | undefined,
    };
  } catch (e) {
    const err = e as AxiosError;
    assert(err.response);
    const resp = {
      statusCode: err.response.status,
      body: err.response.data,
      headers: err.response.headers,
    };
    console.error(resp);
    console.error("body decoded", JSON.stringify(JSON.parse(resp.body as string), null, 2));
    return resp as APIGatewayProxyResult;
  }
}

export function invokeLocalHandlerOrMakeAPICall(
  TEST_TYPE: keyof typeof TEST_TYPES,
  opts: ApiGwEventOptions,
  handler?: (event: APIGatewayProxyEventV2, context: Context) => Promise<APIGatewayProxyResult>,
  apiUrl?: string,
  context?: Context
): Promise<APIGatewayProxyResult> {
  if (TEST_TYPE === TEST_TYPES.UNIT) {
    assert(handler);
    assert(context);
    const event = apiGwEventV2(opts);
    return handler(event, context);
  } else if (TEST_TYPE === TEST_TYPES.E2E) {
    assert(apiUrl);
    return apiRequest(apiUrl, opts);
  } else {
    throw new Error("TEST_TYPE is not set");
  }
}
