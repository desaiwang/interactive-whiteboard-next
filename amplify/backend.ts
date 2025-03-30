import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

// import CDK resources:
import {
  CfnApi,
  CfnChannelNamespace,
  AuthorizationType,
} from "aws-cdk-lib/aws-appsync";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
});

//AppSync Events for Realtime Changes

// create a new stack for Event API resources:
const customResources = backend.createStack("custom-resources");

// add a new Event API to the stack:
const cfnEventAPI = new CfnApi(customResources, "CfnEventAPI", {
  name: "whiteboard-events-api",
  eventConfig: {
    authProviders: [
      {
        authType: AuthorizationType.USER_POOL,
        cognitoConfig: {
          awsRegion: customResources.region,
          // configure Event API to use the Cognito User Pool provisioned by Amplify:
          userPoolId: backend.auth.resources.userPool.userPoolId,
        },
      },
    ],
    // configure the User Pool as the auth provider for Connect, Publish, and Subscribe operations:
    connectionAuthModes: [{ authType: AuthorizationType.USER_POOL }],
    defaultPublishAuthModes: [{ authType: AuthorizationType.USER_POOL }],
    defaultSubscribeAuthModes: [{ authType: AuthorizationType.USER_POOL }],
  },
});

// create a default namespace for our Event API:
const namespace = new CfnChannelNamespace(
  customResources,
  "CfnEventAPINamespace",
  {
    apiId: cfnEventAPI.attrApiId,
    name: "default",
  }
);

// attach a policy to the authenticated user role in our User Pool to grant access to the Event API:
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  new Policy(customResources, "AppSyncEventPolicy", {
    statements: [
      new PolicyStatement({
        actions: [
          "appsync:EventConnect",
          "appsync:EventSubscribe",
          "appsync:EventPublish",
        ],
        resources: [`${cfnEventAPI.attrApiArn}/*`, `${cfnEventAPI.attrApiArn}`],
      }),
    ],
  })
);

// finally, add the Event API configuration to amplify_outputs:
backend.addOutput({
  custom: {
    events: {
      url: `https://${cfnEventAPI.getAtt("Dns.Http").toString()}/event`,
      aws_region: customResources.region,
      default_authorization_type: AuthorizationType.USER_POOL,
    },
  },
});
