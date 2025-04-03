import { util } from "@aws-appsync/utils";

export function request(ctx) {
  var now = util.time.nowISO8601();

  return {
    operation: "BatchDeleteShape",
    tables: {
      [`Post-${ctx.stash.awsAppsyncApiId}-${ctx.stash.amplifyApiEnvironmentName}`]:
        ctx.args.contents.map((content) =>
          util.dynamodb.toMapValues({
            content,
            id: util.autoId(),
            createdAt: now,
            updatedAt: now,
          })
        ),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.data[
    `Post-${ctx.stash.awsAppsyncApiId}-${ctx.stash.amplifyApiEnvironmentName}`
  ];
}
