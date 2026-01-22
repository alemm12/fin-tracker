# Financial Tracker

A full-stack personal finance tracking application built with AWS Lambda, DynamoDB, and Next.js.

## Architecture

- **Backend**: TypeScript Lambda functions + API Gateway + DynamoDB
- **Frontend**: React/Next.js hosted on S3 + CloudFront
- **Auth**: Custom Lambda-based JWT authentication
- **Storage**: S3 for receipts/documents
- **Infrastructure**: Terraform for IaC

## Tech Stack

### Backend

- TypeScript + Node.js 20
- AWS Lambda (serverless functions)
- DynamoDB (single-table design)
- Zod for validation
- Vitest for testing

### Frontend

- Next.js 14 (App Router)
- React Query for data fetching
- TailwindCSS for styling
- Chart.js for visualizations

### Infrastructure

- Terraform for AWS infrastructure
- GitHub Actions for CI/CD

## Project Structure

```
fin-tracker/
├── packages/
│   ├── types/          # Shared TypeScript types
│   ├── validation/     # Zod validation schemas
│   └── shared/         # Shared utilities (JWT, dates, etc.)
├── services/
│   └── api/            # Lambda function handlers
│       ├── src/
│       │   ├── handlers/
│       │   │   ├── auth/
│       │   │   ├── transactions/
│       │   │   └── budgets/
│       │   ├── lib/
│       │   └── middleware/
│       └── package.json
├── apps/
│   └── web/            # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       └── package.json
├── infrastructure/
│   └── terraform/      # Terraform configuration
└── .github/
    └── workflows/      # GitHub Actions
```

## Features

### Phase 1 - MVP (Implemented)

- ✅ User authentication (signup/login with JWT)
- ✅ Add/edit/delete transactions
- ✅ Categorize expenses
- ✅ Budget setting and tracking
- 🚧 Monthly summary dashboard
- 🚧 Charts (spending by category, trends)

### Phase 2 - Enhanced (Planned)

- ⏳ Receipt uploads to S3
- ⏳ Recurring transaction templates
- ⏳ Export data (CSV/PDF reports)
- ⏳ Multi-currency support

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- AWS Account
- Terraform 1.0+

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd fin-tracker
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in `apps/web/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Create environment variables for Lambda (set in Terraform):

```bash
TABLE_NAME=<dynamodb-table-name>
JWT_SECRET=<your-secret-key>
AWS_REGION=us-east-1
```

### Development

#### Run the frontend locally:

```bash
pnpm web:dev
```

#### Build the API:

```bash
pnpm api:build
```

#### Run tests:

```bash
pnpm test
```

#### Type checking:

```bash
pnpm type-check
```

## Deployment

### 1. Configure AWS Credentials

Set up your AWS credentials:

```bash
aws configure
```

### 2. Configure Terraform

1. Copy the example tfvars:

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars` with your values:

```hcl
aws_region   = "us-east-1"
environment  = "dev"
project_name = "fin-tracker"
jwt_secret   = "your-secret-key-change-me-in-production"
```

3. Configure the Terraform backend in `main.tf` (optional but recommended):

```hcl
backend "s3" {
  bucket = "fin-tracker-terraform-state"
  key    = "fin-tracker/terraform.tfstate"
  region = "us-east-1"
}
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
pnpm tf:init

# Review the plan
pnpm tf:plan

# Apply the infrastructure
pnpm tf:apply
```

This will create:

- DynamoDB table
- Lambda functions
- API Gateway
- S3 buckets (receipts + frontend)
- CloudFront distribution
- IAM roles and policies

### 4. Deploy Lambda Functions

```bash
# Build the API
pnpm api:build

# Package and deploy (handled by Terraform)
cd infrastructure/terraform
terraform apply
```

### 5. Deploy Frontend

```bash
# Build the frontend
pnpm web:build

# Upload to S3 (replace with your bucket name)
aws s3 sync apps/web/out s3://fin-tracker-frontend-dev

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <your-distribution-id> --paths "/*"
```

## DynamoDB Schema

Single-table design with the following access patterns:

```
PK: USER#<userId>
SK: TRANSACTION#<timestamp>#<transactionId>

Example items:

# User
{
  PK: "USER#123",
  SK: "USER#123",
  type: "USER",
  email: "user@example.com",
  name: "John Doe"
}

# Transaction
{
  PK: "USER#123",
  SK: "TRANSACTION#2024-01-15T10:30:00Z#txn_abc",
  type: "TRANSACTION",
  amount: 45.99,
  category: "groceries",
  description: "Whole Foods"
}

# Budget
{
  PK: "USER#123",
  SK: "BUDGET#2024-01#groceries",
  type: "BUDGET",
  category: "groceries",
  limit: 500,
  month: "2024-01"
}
```

### GSI1 (Category Index)

```
GSI1PK: USER#<userId>#CAT#<category>
GSI1SK: <date>
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token

### Transactions

- `GET /transactions` - List transactions (with filters)
- `POST /transactions` - Create transaction
- `GET /transactions/{id}` - Get transaction
- `PUT /transactions/{id}` - Update transaction
- `DELETE /transactions/{id}` - Delete transaction

### Budgets

- `GET /budgets` - List budgets
- `POST /budgets` - Create budget

## GitHub Actions

### CI Workflow

Runs on every PR and push to main:

- Type checking
- Linting
- Tests
- Build verification
- Terraform validation

### Deploy Workflow

Manual or automatic deployment:

- Build and package Lambda functions
- Deploy infrastructure with Terraform
- Deploy frontend to S3
- Invalidate CloudFront cache

### Required Secrets

Set these in your GitHub repository settings:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
JWT_SECRET
```

### Required Variables

```
AWS_REGION (default: us-east-1)
API_URL
FRONTEND_BUCKET
CLOUDFRONT_DISTRIBUTION_ID
```

## Cost Optimization

- **Lambda**: Provisioned concurrency not used (on-demand)
- **DynamoDB**: On-demand billing (free tier: 25 WCU/RCU)
- **S3**: Lifecycle policies for receipts (IA after 90 days, Glacier after 365)
- **CloudFront**: Price Class 100 (cheapest)
- **API Gateway**: Caching for read-heavy endpoints

**Expected monthly cost**: $0-2 for personal use (within AWS free tier)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- HTTPS-only (CloudFront + API Gateway)
- S3 buckets with public access blocked
- IAM least-privilege policies
- Input validation with Zod
- SQL injection protection (DynamoDB NoSQL)

## Testing

Run all tests:

```bash
pnpm test
```

Run tests for specific package:

```bash
pnpm --filter @fin-tracker/api test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a PR

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
