# Lambda function configurations
locals {
  lambda_functions = {
    # Auth
    "auth-register" = {
      handler = "register.handler"
      path    = "auth/register"
      method  = "POST"
    }
    "auth-login" = {
      handler = "login.handler"
      path    = "auth/login"
      method  = "POST"
    }
    "auth-refresh" = {
      handler = "refresh.handler"
      path    = "auth/refresh"
      method  = "POST"
    }
    # Transactions
    "transactions-create" = {
      handler = "create.handler"
      path    = "transactions"
      method  = "POST"
    }
    "transactions-list" = {
      handler = "list.handler"
      path    = "transactions"
      method  = "GET"
    }
    "transactions-get" = {
      handler = "get.handler"
      path    = "transactions/{id}"
      method  = "GET"
    }
    "transactions-update" = {
      handler = "update.handler"
      path    = "transactions/{id}"
      method  = "PUT"
    }
    "transactions-delete" = {
      handler = "delete.handler"
      path    = "transactions/{id}"
      method  = "DELETE"
    }
    # Budgets
    "budgets-create" = {
      handler = "create.handler"
      path    = "budgets"
      method  = "POST"
    }
    "budgets-list" = {
      handler = "list.handler"
      path    = "budgets"
      method  = "GET"
    }
  }

  lambda_environment = {
    TABLE_NAME = aws_dynamodb_table.main.name
    JWT_SECRET = var.jwt_secret
  }
}

# Lambda functions
resource "aws_lambda_function" "api" {
  for_each = local.lambda_functions

  filename      = "../../services/api/dist/${each.key}.zip"
  function_name = "${var.project_name}-${each.key}-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = each.value.handler
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = local.lambda_environment
  }

  source_code_hash = fileexists("../../services/api/dist/${each.key}.zip") ? filebase64sha256("../../services/api/dist/${each.key}.zip") : null

  lifecycle {
    ignore_changes = [source_code_hash]
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${aws_lambda_function.api[each.key].function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
}
