![Logo Openpay](https://public.openpay.mx/images/logos/openpay/logo_login.png)

# Openpay Node.js

The official SDK for integrating Openpay into your Node.js apps.

## API Documentation

Full API documentation available at:

- México: https://documents.openpay.mx/docs/api/
- Colombia: https://documents.openpay.co/api/
- Perú: https://documents.openpay.pe/api-v2/

## 🚀 Quick Start

Install:

```bash
# npm
npm i @obseqia/openpay-node

# pnpm
pnpm i @obseqia/openpay-node

# yarn
yarn add @obseqia/openpay-node
```

Instantiate:

```ts
// ESM / Typescript
import { Openpay } from "@obseqia/openpay-node";

// CommonJS
const { Openpay } = require("@obseqia/openpay-node");

const openpay = new Openpay({
  merchantId: process.env.OPENPAY_MERCHANT_ID ?? '',
  privateKey: process.env.OPENPAY_PRIVATE_KEY ?? '',
  isProductionReady: false,
  clientIP: '127.0.0.1', // Public IP address of the client
  countryCode: 'mx',
});

// Use the API
await openpay.<resource>.<method>();
```

## ✔️ Features

- ESM and Typescript support
- Async/await support
- Production/Sandbox environments
- Only 1 dependency. Uses [`ofetch`](https://github.com/unjs/ofetch) for simple data fetching
- API errors are thrown by `ofetch`. Use try/catch to handle them gracefully

> [!IMPORTANT]
> Make sure to review the [official documentation for your country](#api-documentation) to know exactly which API methods are available and country-specific fields that might be required.

## ✔️ Compatibility

This SDK is built for Node.js v24.0.0 and above.

## 🌎 Country Compatibility

All three countries share the same SDK interface but not every resource or field is available in every country.

### Resources

| Resource | México | Colombia | Perú |
| --- | :---: | :---: | :---: |
| `charges` | ✅ | ✅ | ✅ |
| `charges.capture` | ✅ | ❌ | ❌ |
| `charges.refund` | ✅ | ✅ | ✅ |
| `cards` | ✅ | ✅ | ✅ |
| `customers` | ✅ | ✅ | ✅ |
| `customers.charges` | ✅ | ✅ | ✅ |
| `customers.cards` | ✅ | ✅ | ✅ |
| `customers.subscriptions` | ✅ | ✅ | ✅ |
| `customers.bankaccounts` | ✅ | ❌ | ❌ |
| `customers.transfers` | ✅ | ❌ | ❌ |
| `customers.payouts` | ✅ | ❌ | ❌ |
| `customers.pse` | ❌ | ✅ | ❌ |
| `customers.checkouts` | ❌ | ❌ | ✅ |
| `fees` | ✅ | ❌ | ❌ |
| `payouts` | ✅ | ❌ | ❌ |
| `plans` | ✅ | ✅ | ✅ |
| `tokens` | ✅ | ✅ | ✅ |
| `stores` | ✅ | ✅ | ❌ |
| `webhooks` | ✅ | ✅ | ✅ |
| `pse` | ❌ | ✅ | ❌ |
| `checkouts` | ❌ | ❌ | ✅ |

### Country-specific fields

| Field | Resource | Country | Notes |
| --- | --- | :---: | --- |
| `iva` | `Charge.CreateInput` | Colombia | Tax field required for some charge types |
| `customer_address` | `Customer`, `Customer.CreateInput` | Colombia | Colombian address structure (`department`, `city`, `additional`) |
| `clientIP` | `Openpay` constructor | All | Required. IPv4 only. Used for anti-fraud system |

## ⚙️ Configuration

To instantiate the Openpay SDK, you need to pass the following configurations:

```ts
import { Openpay } from "@obseqia/openpay-node";

const openpay = new Openpay({
  // Options
});
```

| Option            | Type                       | Description                                                                                                           |
| ----------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| merchantId        | `string`                   | Your unique merchant ID from the Openpay dashboard                                                                    |
| privateKey        | `string`                   | Your unique private key from the Openpay dashboard                                                                    |
| isProductionReady | `boolean`                  | If `false`, all methods will call the Sandbox API. Otherwise, the Production API will be used.                        |
| countryCode?      | `"mx"` \| `"co"` \| `"pe"` | The country to use the API from. Only México (`mx`), Colombia (`co`) and Perú (`pe`) are supported. Defaults to `mx`. |
| clientIP          | `string`                   | The IP address of the client making the request. Required for charges anti-fraud system.                              |

If your application supports multiple countries, or you have multiple merchant accounts, we recommend creating an `Openpay` instance for each country/merchant to avoid accidentally using the wrong API.

However, if you need to change any of these configurations after instantiation, you can do so with the following methods:

```ts
openpay.setMerchantId("new-merchant-id");
openpay.setPrivateKey("new-private-key");
openpay.setClientIP("127.0.0.1");
openpay.setProductionReady(true);
openpay.setCountryCode("co");
```

## ✔️ Error Handling

Whenever the API returns an error or the SDK is unable to communicate with the API, `Openpay` will throw a `FetchError` from `ofetch`. You can handle any error by wrapping the API call inside of a `try`/`catch` block:

```ts
import { FetchError } from "ofetch";

try {
  const customer = await openpay.customers.create(input);
} catch (error) {
  if (error instanceof FetchError) {
    console.error("Openpay API error:", error.data);
  }
}
```

If the `FetchError` was created by the Openpay API, `error.data` will have this shape:

| Property                | Type                                       |
| ----------------------- | ------------------------------------------ |
| error.data.category     | `"request"` \| `"internal"` \| `"gateway"` |
| error.data.error_code   | `number`                                   |
| error.data.description  | `string`                                   |
| error.data.http_code    | `number`                                   |
| error.data.request_id   | `string`                                   |
| error.data.fraud_rules? | `string[]` \| `undefined`                  |

Any other error that was not caused by the Openpay API, such as connection errors, won't have the same `error.data` shape and must be handled as an `ofetch` `FetchError`.

For detailed descriptions and possible error codes, check out [the official documentation](#api-documentation).

## ✔️ Examples

### Customers

#### Creating a customer

```ts
// Optional. Use type safety
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Customer.CreateInput = {
  name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone_number: "1234567890",
};

try {
  const customer = await openpay.customers.create(input);
  console.log("The newly created customer:", customer);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

#### Creating a charge

```ts
// Optional. Use type safety
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Charge.CreateFromCard = {
  amount: 50,
  method: "card",
  description: "Test existing card charges",
  device_session_id: "fraud-protection-token", // Token from client used for fraud prevention
  customer: {
    name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone_number: "1234567890",
  },
  card: {
    card_number: "4111111111111111",
    holder_name: "John Doe",
    expiration_year: "29",
    expiration_month: "1",
    cvv2: "110",
  },
};

try {
  const transaction = await openpay.charges.create(input);
  console.log("The newly created transaction:", transaction);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

### Webhooks

#### Managing webhooks

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Webhook.CreateInput = {
  url: "https://example.com/webhook",
  user: "webhook_user",
  password: "webhook_password",
  event_types: ["charge.succeeded", "charge.failed", "payout.created"],
};

try {
  // Create a webhook
  const webhook = await openpay.webhooks.create(input);
  console.log("Webhook created:", webhook.id);

  // List webhooks
  const webhooks = await openpay.webhooks.list();
  console.log("All webhooks:", webhooks);

  // Get a specific webhook
  const retrievedWebhook = await openpay.webhooks.get(webhook.id);
  console.log("Retrieved webhook:", retrievedWebhook);

  // Delete a webhook
  await openpay.webhooks.delete(webhook.id);
  console.log("Webhook deleted");
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more webhook examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Tokens

#### Creating a token

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Token.CreateInput = {
  holder_name: "John Doe",
  card_number: "4111111111111111",
  cvv2: "110",
  expiration_month: "12",
  expiration_year: "25",
  address: {
    line1: "123 Main St",
    line2: "Apt 4",
    city: "Mexico City",
    state: "Mexico",
    postal_code: "06500",
    country_code: "MX",
  },
};

try {
  const token = await openpay.tokens.create(input);
  console.log("Token created:", token.id);

  // Use the token in a charge
  const chargeInput: IOpenpay.Charge.CreateInput = {
    method: "card",
    source_id: token.id,
    amount: 100,
    description: "Charge using token",
  };
  const charge = await openpay.charges.create(chargeInput);
  console.log("Charge using token:", charge.id);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more token examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Cards

#### Managing cards

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Card.CreateInput = {
  holder_name: "John Doe",
  card_number: "4111111111111111",
  cvv2: "110",
  expiration_month: "12",
  expiration_year: "25",
};

try {
  // Create a card
  const card = await openpay.cards.create(input);
  console.log("Card created:", card.id);

  // List cards
  const cards = await openpay.cards.list();
  console.log("All cards:", cards);

  // Get a specific card
  const retrievedCard = await openpay.cards.get(card.id);
  console.log("Retrieved card:", retrievedCard);

  // Update a card
  const updateInput: IOpenpay.Card.UpdateInput = {
    holder_name: "Jane Doe",
  };
  await openpay.cards.update(card.id, updateInput);

  // Delete a card
  await openpay.cards.delete(card.id);
  console.log("Card deleted");
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more card examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Plans & Subscriptions

#### Creating a plan

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Plan.CreateInput = {
  name: "Monthly Subscription",
  amount: 99.99,
  repeat_every: 1,
  repeat_unit: "month",
  retry_times: 2,
  status_after_retry: "cancelled",
  trial_days: 7,
};

try {
  const plan = await openpay.plans.create(input);
  console.log("Plan created:", plan.id);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

#### Creating a subscription

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Subscription.CreateInput = {
  plan_id: "plan_id_here", // Use the ID from a previously created plan
  source_id: "card_id_here", // Use an existing customer card ID
  trial_end_date: "2025-06-06",
};

try {
  const subscription = await openpay.customers.subscriptions.create("customer_id", input);
  console.log("Subscription created:", subscription.id);

  // List customer subscriptions
  const subscriptions = await openpay.customers.subscriptions.list("customer_id");
  console.log("Customer subscriptions:", subscriptions);

  // Get a specific subscription
  const retrievedSub = await openpay.customers.subscriptions.get("customer_id", subscription.id);
  console.log("Subscription details:", retrievedSub);

  // Update a subscription
  const updateInput: IOpenpay.Subscription.UpdateInput = {
    trial_end_date: "2025-07-06",
  };
  await openpay.customers.subscriptions.update("customer_id", subscription.id, updateInput);

  // Delete a subscription
  await openpay.customers.subscriptions.delete("customer_id", subscription.id);
  console.log("Subscription deleted");
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more subscription examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Bank Accounts

> [!NOTE]
> Bank accounts are available in **México only**.

#### Managing bank accounts

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.BankAccount.CreateInput = {
  holder_name: "John Doe",
  alias: "My Bank Account",
  clabe: "012345678901234567", // 18-digit CLABE number
};

try {
  // Create a bank account for a customer
  const bankAccount = await openpay.customers.bankaccounts.create("customer_id", input);
  console.log("Bank account created:", bankAccount.id);

  // List customer bank accounts
  const accounts = await openpay.customers.bankaccounts.list("customer_id");
  console.log("Customer bank accounts:", accounts);

  // Get a specific bank account
  const retrievedAccount = await openpay.customers.bankaccounts.get("customer_id", bankAccount.id);
  console.log("Bank account details:", retrievedAccount);

  // Delete a bank account
  await openpay.customers.bankaccounts.delete("customer_id", bankAccount.id);
  console.log("Bank account deleted");
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more bank account examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Transfers

> [!NOTE]
> Transfers are available in **México only**.

#### Creating a transfer

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Transfers.CreateInput = {
  customer_id: "destination_customer_id",
  amount: 150.50,
  description: "Transfer to customer",
  order_id: "ORD-123456",
};

try {
  // Create a transfer
  const transfer = await openpay.customers.transfers.create("source_customer_id", input);
  console.log("Transfer created:", transfer.id);

  // List customer transfers
  const transfers = await openpay.customers.transfers.list("customer_id");
  console.log("Customer transfers:", transfers);

  // Get a specific transfer
  const retrievedTransfer = await openpay.customers.transfers.get("customer_id", transfer.id);
  console.log("Transfer details:", retrievedTransfer);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more transfer examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Payouts

> [!NOTE]
> Payouts are available in **México only**.

#### Creating a payout

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Payout.CreateInput = {
  method: "bank_account",
  amount: 500.00,
  description: "Monthly payout",
  order_id: "PAYOUT-123456",
  bank_account: {
    clabe: "012345678901234567",
    holder_name: "John Doe",
  },
};

try {
  // Create a payout
  const payout = await openpay.payouts.create(input);
  console.log("Payout created:", payout.id);

  // List payouts
  const payouts = await openpay.payouts.list();
  console.log("All payouts:", payouts);

  // Get a specific payout
  const retrievedPayout = await openpay.payouts.get(payout.id);
  console.log("Payout details:", retrievedPayout);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more payout examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Fees

> [!NOTE]
> Fees are available in **México only**.

#### Charging a fee

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Fee.CreateInput = {
  customer_id: "customer_to_charge",
  amount: 25.50,
  description: "Platform fee",
  order_id: "FEE-123456",
};

try {
  // Create a fee
  const fee = await openpay.fees.create(input);
  console.log("Fee created:", fee.id);

  // List fees
  const fees = await openpay.fees.list();
  console.log("All fees:", fees);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more fee examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### Stores

#### Searching stores by location

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Store.ListQuery = {
  latitud: 19.4326, // Latitude
  longitud: -99.1332, // Longitude
  kilometers: 5, // Search radius
  amount: 500, // Transaction amount
};

try {
  const stores = await openpay.stores.list(input);
  console.log("Nearby stores:", stores);

  // Find a specific store
  stores.forEach((store) => {
    console.log(`Store: ${store.name} at ${store.address.city}`);
    console.log(`Chain: ${store.paynet_chain.name}`);
  });
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more store examples, see [`tests/mexico.spec.ts`](/tests/mexico.spec.ts).

### PSE

> [!NOTE]
> PSE (Pagos Seguros en Línea) is available in **Colombia only**.

#### Creating a PSE charge

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Charge.CreateInput = {
  method: "bank_account",
  amount: 75.00,
  description: "PSE payment",
  order_id: "PSE-123456",
  customer: {
    name: "Juan",
    last_name: "García",
    email: "juan.garcia@example.com",
    phone_number: "3125551234",
  },
};

try {
  const charge = await openpay.pse.create(input);
  console.log("PSE charge created:", charge.id);

  // For customer PSE charges
  const customerCharge = await openpay.customers.pse.create("customer_id", input);
  console.log("Customer PSE charge created:", customerCharge.id);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more PSE examples, see [`tests/colombia.spec.ts`](/tests/colombia.spec.ts).

### Checkouts

> [!NOTE]
> Checkouts are available in **Perú only**.

#### Creating a checkout

```ts
import type { IOpenpay } from "@obseqia/openpay-node";

const input: IOpenpay.Checkout.CreateInput = {
  amount: 200.00,
  description: "Product purchase",
  order_id: "ORDER-123456",
  currency: "PEN",
  redirect_url: "https://example.com/return",
  expiration_date: "2025-12-31",
  send_email: true,
  customer: {
    name: "Carlos",
    last_name: "Rodríguez",
    email: "carlos@example.com",
    phone_number: "987654321",
  },
};

try {
  // Create a checkout
  const checkout = await openpay.checkouts.create(input);
  console.log("Checkout created:", checkout.id);
  console.log("Checkout link:", checkout.checkout_link);

  // List checkouts
  const checkouts = await openpay.checkouts.list();
  console.log("All checkouts:", checkouts);

  // Get a specific checkout
  const retrievedCheckout = await openpay.checkouts.get(checkout.id);
  console.log("Checkout details:", retrievedCheckout);

  // Update checkout
  const updateInput: IOpenpay.Checkout.UpdateInput = {
    description: "Updated description",
    redirect_url: "https://example.com/new-return",
  };
  await openpay.checkouts.update(checkout.id, "available", updateInput);
} catch (error) {
  console.error("Openpay API error:", error);
}
```

For more checkout examples, see [`tests/peru.spec.ts`](/tests/peru.spec.ts).

### Global Timeout

#### Configuring the request timeout

```ts
import { Openpay } from "@obseqia/openpay-node";

const openpay = new Openpay({
  merchantId: "your-merchant-id",
  privateKey: "your-private-key",
  clientIP: "127.0.0.1",
  countryCode: "mx",
});

// Set a custom timeout for all requests (in milliseconds)
openpay.setTimeout(15000); // 15 seconds

try {
  // All subsequent API calls will use the new timeout
  const customer = await openpay.customers.create({
    name: "John",
    email: "john@example.com",
  });
  console.log("Customer created with custom timeout");
} catch (error) {
  console.error("Openpay API error:", error);
}
```

> [!TIP]
> For more detailed examples, take a look at the [tests folder](/tests/) and the [API documentation for your country](#api-documentation).

## 🔧 Contributions

To contribute to this project, fork this repository and install the dependencies with pnpm:

```bash
pnpm i
```

The project uses [ESLint](https://eslint.org/) for linting and [Prettier](https://prettier.io/) for formatting. If you are using VS Code, we recommend installing the `dbaeumer.vscode-eslint` and `esbenp.prettier-vscode` extensions.

### 🧪 Tests

This project runs tests using [Vitest](https://vitest.dev/) with Typescript.

There are 3 test files available:

- [`tests/colombia.spec.ts`](/tests/colombia.spec.ts)
- [`tests/mexico.spec.ts`](/tests/mexico.spec.ts)
- [`tests/peru.spec.ts`](/tests/peru.spec.ts)

Each one of them tests specific methods that are available to their specific country. However, the one with most of the SDK functionality is [`tests/mexico.spec.ts`](/tests/mexico.spec.ts) since it supports most of the API features.

To run the tests, you must create a `.env.testing` file. Use [`.env.example`](/.env.example) as reference. It must contain the following:

| Variable                  | Description                                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| OPENPAY_MERCHANT_ID       | Your own unique `merchantId` from the Openpay Sandbox Dashboard                                                                                      |
| OPENPAY_PRIVATE_KEY       | Your own unique `privateKey` from the Openpay Sandbox Dashboard                                                                                      |
| OPENPAY_DEVICE_SESSION_ID | A session ID generated by the Openpay.js client for fraud protection                                                                                 |
| OPENPAY_WEBHOOK_TEST_URL  | To test webhooks, you must pass a valid endpoint that would reply with status `200`. We recommend creating a free test url from https://webhook.site |

> [!NOTE]
> Please make sure you use your merchant ID and private key for a **SANDBOX** environment. All tests will run on sandbox mode, so passing production values will cause every test to fail.

Before running the tests, you must build the package:

```bash
pnpm build
```

Now, you can run the tests for a specific country with their own script:

```bash
# For México
pnpm test:mx

# For Colombia
pnpm test:co

# For Perú
pnpm test:pe
```

> [!IMPORTANT]
> The tests depend on having `OPENPAY_MERCHANT_ID` and `OPENPAY_PRIVATE_KEY` from an account created in the country you're running the tests on. For example: if you want to run `pnpm test:co`, you must use a merchant ID and private key from an account created in Openpay Colombia. Otherwise the tests will fail.

> [!NOTE]
> For México tests, the transfers and fees API's might fail since they require the customer to have funds, but the account created during the test won't have any. If you get a different error, please check your implementation.
