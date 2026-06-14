# DB Setup — DynamoDB persistence (optional, ~1h, do anytime)

**Decision:** DynamoDB — on-AWS, no connection management, works via the Lambda execution role, append-only event log fits the passport model exactly. **The demo does NOT depend on this**: when `DYNAMODB_TABLE_NAME` is unset (or any call fails), the backend uses an in-memory store seeded from JSON. Set it up whenever convenient; skip entirely if time-pressed.

**One table, several stores (single-table design).** The passport event log AND the demo stores (resell listings, returns desk, buyer carts) all live in this one table via `backend/app/store.py`, namespaced by synthetic partition keys — so a listing made on one Lambda instance / an interest tapped on another / a cart and a return survive a cold start or a parallel instance (audit findings 2 & 5):

| Store | partition key (`item_id`) | sort key (`ts`) |
|-------|---------------------------|------------------|
| passport events | `<item_id>` (e.g. `SL-001`) | event timestamp (microsecond) |
| resell listings | `LISTING` | `<listing_id>` |
| returns desk | `RETURNS` | `<return_id>` |
| buyer carts | `CART#<persona>` | `cart` |

Every write is best-effort and every read falls back to the in-memory store on any error, so a DynamoDB problem never blocks the demo.

## 1. Create the table (one command)

```powershell
aws dynamodb create-table `
  --table-name SecondLifePassport `
  --attribute-definitions AttributeName=item_id,AttributeType=S AttributeName=ts,AttributeType=S `
  --key-schema AttributeName=item_id,KeyType=HASH AttributeName=ts,KeyType=RANGE `
  --billing-mode PAY_PER_REQUEST `
  --region ca-central-1
```

## 2. IAM — add to the Lambda execution role

Attach this inline policy to the existing Lambda execution role (Console → IAM → Roles → `<LAMBDA_ROLE_NAME>` → Add inline policy → JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:BatchWriteItem"],
    "Resource": "arn:aws:dynamodb:ca-central-1:656751413989:table/SecondLifePassport"
  }]
}
```

> `GetItem` was added for the buyer-cart read-back; `PutItem`/`Query` cover the passport, listings, and returns. Without `GetItem` the cart simply falls back to per-instance (everything else still syncs).

## 3. Env vars

- Lambda (Console → Configuration → Environment variables) AND `backend/.env`:
  `DYNAMODB_TABLE_NAME=SecondLifePassport`
  (`AWS_REGION=ca-central-1` already set.)

## 4. Verify

```powershell
# after redeploy: process one item end-to-end (grade + route), then:
aws dynamodb query --table-name SecondLifePassport --region ca-central-1 `
  --key-condition-expression "item_id = :i" `
  --expression-attribute-values '{\":i\": {\"S\": \"SL-001\"}}'
```
Expect rows whose `data` JSON carries `GRADED` and `ROUTED` events (the event name + payload are stored inside the `data` attribute). For the resell board use `:i = "LISTING"`, for returns `:i = "RETURNS"`, for a cart `:i = "CART#rahul"`. If the table/env var is absent, the app silently uses the in-memory store — that's by design.
