import { describe, expect, it, test } from "vitest";
import { handler } from "@backend/lambda/api";
import {
  apiGwContext,
  ApiGwEventOptions,
  invokeLocalHandlerOrMakeAPICall,
  setEnvVariables,
  TEST_TYPES,
} from "@tests/helpers";
import { Environment, testConfig } from "@config/index";

const TEST_ENVIRONMENT: Environment = "dev";
const ECHO_TEST_RESPONSES = true;

/* Allow to be set externally */
/* Set one of these, defaults to unit, which runs the function locally, e2e does an API call. */
let TEST_TYPE = TEST_TYPES.UNIT as keyof typeof TEST_TYPES;
// let TEST_TYPE = TEST_TYPES.E2E as keyof typeof TEST_TYPES; //uncomment for easier testing
if (process.env.TEST_TYPE)
  TEST_TYPE = process.env.TEST_TYPE as keyof typeof TEST_TYPES;

describe("Backend Basic Tests", function () {
  it("OPTIONS call", async function () {
    if (TEST_TYPE === TEST_TYPES.UNIT) {
      console.log(
        "Skipping unit test, CORs is handled by AWS services, we are not catering for it in the code",
      );
      return;
    }

    const context = apiGwContext();
    const event: ApiGwEventOptions = {
      method: "OPTIONS",
      path: "/complex?query=trigger-cors",
      body: "",
      headers: {
        "Host": testConfig[TEST_ENVIRONMENT].backend.api_url.replace("https://", ""),
        "Origin": "https://something-diffrernt.com",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
        "Connection": "keep-alive",
      },
    };

    setEnvVariables(testConfig[TEST_ENVIRONMENT].backend.lambdaApi.env);
    const resp = await invokeLocalHandlerOrMakeAPICall(
      TEST_TYPE,
      event,
      handler,
      testConfig[TEST_ENVIRONMENT].backend.api_url,
      context,
    );
    ECHO_TEST_RESPONSES && console.log(resp);

    expect(resp.statusCode).to.eq(200);
  });

  it("/ returns correct text", async function () {
    const context = apiGwContext();
    const event: ApiGwEventOptions = {
      method: "GET",
      path: "/",
      body: "",
      origin: "xxx",
    };

    setEnvVariables(testConfig[TEST_ENVIRONMENT].backend.lambdaApi.env);
    const resp = await invokeLocalHandlerOrMakeAPICall(
      TEST_TYPE,
      event,
      handler,
      testConfig[TEST_ENVIRONMENT].backend.api_url,
      context,
    );
    ECHO_TEST_RESPONSES && console.log(resp);

    expect(resp.statusCode).to.eq(200);
    expect(resp.body.length > 0).to.be.eq(true);
    expect(resp.body.startsWith("Hello World")).to.be.eq(true);
  });
});
