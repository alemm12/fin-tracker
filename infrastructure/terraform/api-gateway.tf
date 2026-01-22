# API Gateway
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Financial Tracker API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Resources and Methods
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_resource" "transaction_id" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.transactions.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "budgets" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "budgets"
}

# CORS configuration is defined in api-gateway-integrations.tf

# Deployment
resource "aws_api_gateway_deployment" "api" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.api.body,
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.transactions.id,
      aws_api_gateway_resource.budgets.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_lambda_function.api,
    aws_api_gateway_integration.auth_register_post,
    aws_api_gateway_integration.auth_login_post,
    aws_api_gateway_integration.auth_refresh_post,
    aws_api_gateway_integration.transactions_post,
    aws_api_gateway_integration.transactions_get,
    aws_api_gateway_integration.transaction_id_get,
    aws_api_gateway_integration.transaction_id_put,
    aws_api_gateway_integration.transaction_id_delete,
    aws_api_gateway_integration.budgets_post,
    aws_api_gateway_integration.budgets_get,
  ]
}

resource "aws_api_gateway_stage" "api" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  # Access logging disabled for dev (requires CloudWatch Logs role setup)
  # To enable: Set up CloudWatch Logs role in API Gateway settings
  # dynamic "access_log_settings" {
  #   for_each = var.environment == "prod" ? [1] : []
  #   content {
  #     destination_arn = aws_cloudwatch_log_group.api_gateway.arn
  #     format = jsonencode({
  #       requestId      = "$context.requestId"
  #       ip             = "$context.identity.sourceIp"
  #       caller         = "$context.identity.caller"
  #       user           = "$context.identity.user"
  #       requestTime    = "$context.requestTime"
  #       httpMethod     = "$context.httpMethod"
  #       resourcePath   = "$context.resourcePath"
  #       status         = "$context.status"
  #       protocol       = "$context.protocol"
  #       responseLength = "$context.responseLength"
  #     })
  #   }
  # }
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api-gateway/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = local.lambda_functions

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
