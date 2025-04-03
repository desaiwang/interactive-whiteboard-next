// BatchDeleteShapesByCanvasHandler.js
import { util } from "@aws-appsync/utils";

export function request(ctx) {
  // Query to get all shape IDs that belong to this canvas
  return {
    operation: "Query",
    query: {
      expression: "canvasId = :canvasId",
      expressionValues: util.dynamodb.toMapValues({
        ":canvasId": ctx.args.canvasId,
      }),
    },
    index: "byCanvasId", // This must match the GSI name
    select: "ALL_ATTRIBUTES",
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  // If no items found, return true (operation successful, nothing to delete)
  if (!ctx.result.items || ctx.result.items.length === 0) {
    return true;
  }

  // For each item, perform a DeleteItem operation
  const items = ctx.result.items;

  for (const item of items) {
    const deleteRequest = {
      operation: "DeleteItem",
      key: {
        id: item.id,
      },
    };

    try {
      // Use DynamoDB.DeleteItem instead of trying to batch
      ctx.stash.dynamodb.DeleteItem(deleteRequest);
    } catch (error) {
      util.error(
        `Failed to delete item ${item.id}: ${error.message}`,
        "DeleteItemError"
      );
    }
  }

  return true;
}
