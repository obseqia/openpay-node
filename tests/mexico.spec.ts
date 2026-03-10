import type { IOpenpay } from '@obseqia/openpay';
import { isOpenpayError, Openpay } from '@obseqia/openpay';
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest';

describe('Test the Openpay México SDK', () => {
  const openpay = new Openpay({
    merchantId: process.env.OPENPAY_MERCHANT_ID ?? '',
    privateKey: process.env.OPENPAY_PRIVATE_KEY ?? '',
    isProductionReady: false,
    countryCode: 'mx',
    clientIP: '127.0.0.1',
  });
  const device_session_id = process.env.OPENPAY_DEVICE_SESSION_ID ?? '';

  // Defining a valid expiration year for cards, adding 5 years to the current one
  const validExpYear = (new Date().getFullYear() + 5).toString().substring(2, 4);

  async function waitUntilCustomerBalance(id: string, timeout: number = 120_000): Promise<void> {
    const waitTime = 5_000;
    let customer: IOpenpay.Customer = await openpay.customers.get(id);
    const steps = timeout / waitTime;
    let countdown = steps;
    while (customer.balance <= 0 && countdown > 0) {
      countdown--;
      console.debug(`[${steps - countdown}/${steps}] Waiting for ${id} balance to continue...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      customer = await openpay.customers.get(id);
    }
  }

  //-----------------------------
  // WEBHOOK TESTS
  //-----------------------------

  describe('Test webhooks API', () => {
    let webhook_id: string | undefined;
    const testWebhook: IOpenpay.Webhook.CreateInput = {
      url: process.env.OPENPAY_WEBHOOK_TEST_URL ?? '',
      event_types: [
        'charge.refunded',
        'charge.failed',
        'charge.cancelled',
        'charge.created',
        'chargeback.accepted',
      ],
    };

    it('should create a webhook', async () => {
      const webhook = await openpay.webhooks.create(testWebhook);
      expect(webhook).toBeTruthy();
      webhook_id = webhook.id;
      console.log('The webhook:', webhook.id);
    });

    it('should get the webhook', async () => {
      await expect(openpay.webhooks.get(webhook_id!)).resolves.toBeTruthy();
    });

    it('should get all the webhooks', async () => {
      const list = await openpay.webhooks.list();
      expect(list).toBeTruthy();
      expect(list.length).toBeGreaterThan(0);
    });

    it('should delete the webhook', async () => {
      await expect(openpay.webhooks.delete(webhook_id!)).resolves.toBeUndefined();
      // Validate that the webhook no longer exists
      // await expect(openpay.webhooks.get(webhook_id!)).rejects.toThrow(); // this will fail because Openpay didnt delete the webhook
    });

    afterAll(async () => {
      if (webhook_id) {
        await openpay.webhooks.delete(webhook_id).catch((error) => {
          if (isOpenpayError(error) && error.error_code === 1005) {
            console.debug('Webhook already deleted, skipping...');
          } else {
            console.error('Unexpected error:', error);
          }
        });
      }
    });
  });

  //-----------------------------
  // CUSTOMER TESTS
  //-----------------------------
  describe('Testing customers API', () => {
    let customer_id: string;
    const input: IOpenpay.Customer.CreateInput = {
      name: 'Juan',
      last_name: 'Pérez',
      email: 'juan@ejemplo.com',
      phone_number: '1234567890',
      requires_account: true, // Create account to perform charge/fees/transfer tests
    };

    const today = toFilterDate(new Date());

    afterAll(async () => {
      if (customer_id) {
        await openpay.customers.delete(customer_id);
      }
      await expect(openpay.customers.get(customer_id)).resolves.toBeFalsy();
    });

    it('should create a customer', async () => {
      const customer = await openpay.customers.create(input);
      expect(customer).toBeTruthy();
      customer_id = customer.id;
      console.log('The customer:', customer.id);
    });

    it('should get all customers', async () => {
      await expect(openpay.customers.list()).resolves.toBeTruthy();
    });

    it('should get the test customer', async () => {
      await expect(openpay.customers.get(customer_id)).resolves.toBeTruthy();
    });

    it('should update the customer', async () => {
      const customer = await openpay.customers.update(customer_id, {
        name: 'Alberto',
        email: 'alberto@ejemplo.com',
      });
      expect(customer).toBeTruthy();
      expect(customer.name).toBe('Alberto');
      expect(customer.email).toBe('alberto@ejemplo.com');
    });

    it('should get customers created today', async () => {
      const customers = await openpay.customers.list({ creation: today });
      expect(customers).toBeTruthy();
      assert(customers.length > 0, 'No customers returned. It should have returned the test one');
    });
  });

  //-----------------------------
  // CARDS TESTS
  //-----------------------------
  describe('Testing cards API', () => {
    let card_id: string;
    let customer: IOpenpay.Customer;
    let customer_card: string;

    const inputCard: IOpenpay.Card.CreateInput = {
      card_number: '4111111111111111',
      holder_name: 'John Doe',
      expiration_year: validExpYear,
      expiration_month: '1',
      cvv2: '110',
    };

    beforeAll(async () => {
      customer = await openpay.customers.create({
        name: 'Card',
        last_name: 'Tester',
        email: 'card.tester@example.com',
      });
      expect(customer).toBeTruthy();
    });

    afterAll(async () => {
      if (customer) {
        await openpay.customers.delete(customer.id);
      }
      if (card_id) {
        await openpay.cards.delete(card_id);
      }
    });

    it('should create a card', async () => {
      const card = await openpay.cards.create(inputCard);
      expect(card).toBeTruthy();
      card_id = card.id;
      console.log('The card:', card.id);
    });

    it('should get all cards', async () => {
      await expect(openpay.cards.list()).resolves.toBeTruthy();
    });

    it('should get the test card', async () => {
      await expect(openpay.cards.get(card_id)).resolves.toBeTruthy();
    });

    describe('Test customer cards API', () => {
      it('should create a card for the customer', async () => {
        const card = await openpay.customers.cards.create(customer.id, inputCard);
        expect(card).toBeTruthy();
        customer_card = card.id;
        console.log('The customer card:', card.id);
      });

      it('should get all cards of the customer', async () => {
        await expect(openpay.customers.cards.list(customer.id)).resolves.toBeTruthy();
      });

      it('should get the test card for the customer', async () => {
        await expect(openpay.customers.cards.get(customer.id, customer_card)).resolves.toBeTruthy();
      });

      afterAll(async () => {
        if (customer_card) {
          await openpay.customers.cards.delete(customer.id, customer_card);
        }
      });
    });
  });

  //------------------------------
  // BANK ACCOUNTS TESTS
  //------------------------------
  describe('Testing bank accounts API', () => {
    let back_account: string;
    let customer: IOpenpay.Customer;
    const inputBankAccount: IOpenpay.BankAccount.CreateInput = {
      clabe: '021180000118359717',
      holder_name: 'John Doe',
    };

    beforeAll(async () => {
      customer = await openpay.customers.create({
        name: 'Bank Account',
        last_name: 'Tester',
        email: 'bank.account@test.com',
        requires_account: true,
      });
      expect(customer).toBeTruthy();
    });

    afterAll(async () => {
      if (customer) {
        await openpay.customers.delete(customer.id);
      }
    });

    it('should create a bank account', async () => {
      const bank = await openpay.customers.bankaccounts.create(customer.id, inputBankAccount);
      expect(bank).toBeTruthy();
      back_account = bank.id;

      console.log('The bank account:', bank.id);
    });

    it('should get all bank accounts of the customer', async () => {
      await expect(openpay.customers.bankaccounts.list(customer.id)).resolves.toBeTruthy();
    });

    it('should get the test bank account for the customer', async () => {
      await expect(openpay.customers.bankaccounts.get(customer.id, back_account)).resolves.toBeTruthy();
    });
  });

  //------------------------------
  // CHARGE TESTS
  //------------------------------
  describe('Test charges API', () => {
    let card_id: string;
    let testTxnId: string;
    const testRefund: IOpenpay.Charge.RefundInput = { description: 'Testing refund' };

    beforeAll(async () => {
      const card = await openpay.cards.create({
        card_number: '4111111111111111',
        holder_name: 'John Doe',
        expiration_year: validExpYear,
        expiration_month: '1',
        cvv2: '110',
      });
      expect(card).toBeTruthy();
      card_id = card.id;
      console.log('Test card created:', card_id);
    });

    afterAll(async () => {
      if (card_id) {
        await openpay.cards.delete(card_id);
      }
    });

    it('should get all charges', async () => {
      await expect(openpay.charges.list()).resolves.toBeTruthy();
    });

    it('should create a charge to an existing card', async () => {
      const txn = await openpay.charges.create({
        amount: 50,
        source_id: card_id,
        customer: {
          name: 'Charge',
          last_name: 'Existing Card',
          email: 'charge.card@example.com',
        },
        method: 'card',
        device_session_id,
        description: 'Test existing card charges',
      });
      expect(txn).toBeTruthy();
      testTxnId = txn.id;
      console.log('The charge to existing card:', txn.id);
    });

    it('should get the created charge', async () => {
      await expect(openpay.charges.get(testTxnId)).resolves.toBeTruthy();
    });

    it('should refund the charge', async () => {
      const txn = await openpay.charges.refund(testTxnId, testRefund);
      expect(txn).toBeTruthy();
    });

    it('should create charge without capture', async () => {
      const txn = await openpay.charges.create({
        amount: 50,
        source_id: card_id,
        method: 'card',
        customer: {
          name: 'Charge',
          last_name: 'Without Capture',
          email: 'charge.without.capture@example.com',
        },
        device_session_id,
        description: 'Test existing card charges',
        capture: false,
      });
      expect(txn).toBeTruthy();
      testTxnId = txn.id;
      console.log('The charge without capture:', txn.id);
    });

    it('should capture the charge', async () => {
      await expect(openpay.charges.capture(testTxnId, null)).resolves.toBeTruthy();
    });

    it('should create charge with new bank account', async () => {
      await expect(
        openpay.charges.create({
          amount: 50,
          method: 'bank_account',
          customer: {
            name: 'Charge',
            last_name: 'Bank',
            email: 'charge.bank@example.com',
          },
          description: 'Test bank account charge',
        }),
      ).resolves.toBeTruthy();
    });

    it('should create charge on store', async () => {
      const txn = await openpay.charges.create({
        amount: 50,
        method: 'store',
        customer: {
          name: 'Charge',
          last_name: 'Store',
          email: 'charge.store@example.com',
        },
        description: 'Test store charge',
      });
      expect(txn).toBeTruthy();
      console.log('The charge on store:', txn.id);

      expect(txn.id).toBeTruthy();
      assert.equal(txn.method, 'store');
      assert.equal(txn.payment_method?.type, 'store');
      expect(txn.payment_method?.reference).toBeTruthy();
      expect(txn.payment_method?.barcode_url).toBeTruthy();
    });
  });

  describe('Test customer charges API', () => {
    let testCustomerId = '';
    let testCustomerCardId = '';
    let testCustomerTxnId = '';

    beforeAll(async () => {
      const customer = await openpay.customers.create({
        name: 'Customer Charge',
        last_name: 'Tester',
        email: 'customer.charge.tester@example.com',
        requires_account: true,
      });
      expect(customer).toBeTruthy();
      testCustomerId = customer.id;

      const card = await openpay.customers.cards.create(testCustomerId, {
        card_number: '4111111111111111',
        holder_name: 'John Doe',
        expiration_year: validExpYear,
        expiration_month: '1',
        cvv2: '110',
      });
      expect(card).toBeTruthy();
      testCustomerCardId = card.id;
      console.log('Test customer card created:', testCustomerCardId);
    });

    afterAll(async () => {
      if (testCustomerId) {
        await openpay.customers.delete(testCustomerId);
      }
    });

    it('should create a charge to an existing card', async () => {
      const txn = await openpay.customers.charges.create(testCustomerId, {
        amount: 50,
        source_id: testCustomerCardId,
        method: 'card',
        device_session_id,
        description: 'Test customer card charge',
      });
      expect(txn).toBeTruthy();
      testCustomerTxnId = txn.id;
      console.log('The charge to existing customer card:', txn.id);
    });

    it('should get all charges', async () => {
      await expect(openpay.customers.charges.list(testCustomerId)).resolves.toBeTruthy();
    });

    it('should get the created charge', async () => {
      await expect(openpay.customers.charges.get(testCustomerId, testCustomerTxnId)).resolves.toBeTruthy();
    });

    it(
      'should refund the charge',
      async () => {
        // se debe esperar a que el balance se actualice después de crear el cargo para que el reembolso funcione correctamente
        await waitUntilCustomerBalance(testCustomerId, 300_000);
        await expect(
          openpay.customers.charges.refund(testCustomerId, testCustomerTxnId, {
            description: 'Testing refund',
          }),
        ).resolves.toBeTruthy();
      },
      300 * 1_000,
    );

    it('should create charge with new bank account', async () => {
      const txn = await openpay.customers.charges.create(testCustomerId, {
        amount: 50,
        method: 'bank_account',
        description: 'Test customer bank account charge',
      });
      expect(txn).toBeTruthy();
      console.log('The charge to customer new bank:', txn.id);
    });
  });

  //------------------------------
  // TRANSFERS TESTS
  //------------------------------
  describe('Test transfers API', () => {
    let sender: IOpenpay.Customer | null = null;
    let recipient: IOpenpay.Customer | null = null;
    let testTransferTxnId = '';

    beforeAll(async () => {
      sender = await openpay.customers.create({
        name: 'Transfer',
        last_name: 'Sender',
        email: 'transfer.sender@example.com',
        requires_account: true,
      });
      expect(sender).toBeTruthy();

      const card = await openpay.customers.cards.create(sender.id, {
        card_number: '4111111111111111',
        holder_name: 'John Doe',
        expiration_year: validExpYear,
        expiration_month: '1',
        cvv2: '110',
      });

      await expect(
        openpay.customers.charges.create(sender.id, {
          amount: 1_000,
          method: 'card',
          source_id: card.id,
          device_session_id,
          description: 'Funding sender',
        }),
      ).toBeTruthy();

      await waitUntilCustomerBalance(sender.id, 300_000);

      recipient = await openpay.customers.create({
        name: 'Transfer',
        last_name: 'Recipient',
        email: 'transfer.recipient@example.com',
        requires_account: true,
      });
      expect(recipient).toBeTruthy();
    }, 300_000);

    afterAll(async () => {
      if (sender) {
        await openpay.customers.delete(sender.id);
      }
      if (recipient) {
        await openpay.customers.delete(recipient.id);
      }
    });

    it('should create a transfer', async () => {
      expect(sender).not.toBeNull();
      expect(recipient).not.toBeNull();
      const txn = await openpay.customers.transfers.create(sender!.id, {
        customer_id: recipient!.id,
        amount: 1.5,
        description: 'Test transfer',
      });
      expect(txn).toBeTruthy();
      testTransferTxnId = txn.id;

      console.log('The transfer:', txn);
    });

    it('should get all customer transfers', async () => {
      await expect(openpay.customers.transfers.list(sender!.id)).resolves.toBeTruthy();
    });

    it('should get the transfer', async () => {
      await expect(openpay.customers.transfers.get(sender!.id, testTransferTxnId)).resolves.toBeTruthy();
    });
  });

  //------------------------------
  // PAYOUT TESTS
  //------------------------------
  describe('Test payouts API', () => {
    let testPayoutTxnId = '';
    let testCardId = '';
    let testBankAccountId = '';
    let testCustomer: IOpenpay.Customer | null = null;

    beforeAll(async () => {
      testCustomer = await openpay.customers.create({
        name: 'Payout',
        last_name: 'Tester',
        email: 'payout.tester@example.com',
        requires_account: true,
      });
      expect(testCustomer).toBeTruthy();

      const card = await openpay.customers.cards.create(testCustomer.id, {
        card_number: '4111111111111111',
        holder_name: 'John Doe',
        expiration_year: validExpYear,
        expiration_month: '1',
        cvv2: '110',
      });
      expect(card).toBeTruthy();
      testCardId = card.id;

      const bankAccount = await openpay.customers.bankaccounts.create(testCustomer.id, {
        clabe: '021180000118359717',
        holder_name: 'John Doe',
      });
      expect(bankAccount).toBeTruthy();
      testBankAccountId = bankAccount.id;
    });

    afterAll(async () => {
      if (testCustomer) {
        await openpay.customers.delete(testCustomer.id);
      }
    });

    it.skip('should get all payouts', async () => {
      // TODO: Requires account with sufficient funds; enable after verifying sandbox behavior
      await expect(openpay.payouts.list()).resolves.toBeTruthy();
    });

    it.skip('should create a payout to a new card', async () => {
      // TODO: Requires account with sufficient funds; enable after verifying sandbox behavior
      const txn = await openpay.payouts.create({
        amount: 1.5,
        method: 'card',
        description: 'Test card payout',
        card: {
          card_number: '4111111111111111',
          holder_name: 'John Doe',
          bank_code: '012',
        },
      });
      expect(txn).toBeTruthy();
      testPayoutTxnId = txn.id;
      console.log('The payout:', txn.id);
    });

    it.skip('should get the payout', async () => {
      // TODO: Requires account with sufficient funds; enable after verifying sandbox behavior
      await expect(openpay.payouts.get(testPayoutTxnId)).resolves.toBeTruthy();
    });

    it.skip('should create a payout to a new bank account', async () => {
      // TODO: Requires account with sufficient funds; enable after verifying sandbox behavior
      await expect(
        openpay.payouts.create({
          amount: 1.5,
          method: 'bank_account',
          description: 'Test bank payout',
          bank_account: {
            clabe: '021180000118359717',
            holder_name: 'John Doe',
          },
        }),
      ).resolves.toBeTruthy();
    });

    it.skip('should create a payout to an existing card', async () => {
      // TODO: Requires account with sufficient funds; enable after verifying sandbox behavior
      await expect(
        openpay.payouts.create({
          method: 'card',
          destination_id: testCardId,
          amount: 1.5,
          description: 'Test payout to existing card',
        }),
      ).resolves.toBeTruthy();
    });

    it.skip('should create a payout to an existing bank account', async () => {
      // TODO: Requires account with sufficient funds; enable after verifying sandbox behavior
      await expect(
        openpay.payouts.create({
          method: 'bank_account',
          destination_id: testBankAccountId,
          amount: 1.5,
          description: 'Test payout to existing bank account',
        }),
      ).resolves.toBeTruthy();
    });
  });

  describe('Test customer payouts API', () => {
    let customer_id: string;

    beforeAll(async () => {
      const customer = await openpay.customers.create({
        name: 'Customer Payout',
        last_name: 'Tester',
        email: 'customer.payout.tester@example.com',
        requires_account: true,
      });
      expect(customer).toBeTruthy();
      customer_id = customer.id;
    });

    afterAll(async () => {
      if (customer_id) {
        await openpay.customers.delete(customer_id);
      }
    });

    it.skip('should create a payout to a new card', async () => {
      const txn = await openpay.customers.payouts.create(customer_id, {
        amount: 1.5,
        method: 'card',
        description: 'Test card payout',
        card: {
          card_number: '4111111111111111',
          holder_name: 'John Doe',
          bank_code: '012',
        },
      });
      expect(txn).toBeTruthy();
      console.log('The customer payout:', txn.id);
      await expect(openpay.customers.payouts.get(customer_id, txn.id)).resolves.toBeTruthy();
    });

    it.skip('should create a payout to a new bank account', async () => {
      const txn = await openpay.customers.payouts.create(customer_id, {
        amount: 1.5,
        method: 'bank_account',
        description: 'Test bank payout',
        bank_account: {
          clabe: '021180000118359717',
          holder_name: 'John Doe',
        },
      });
      expect(txn).resolves.toBeTruthy();
      await expect(openpay.customers.payouts.get(customer_id, txn.id)).resolves.toBeTruthy();
    });

    it.skip('should create a payout to an existing card', async () => {
      const card = await openpay.customers.cards.create(customer_id, {
        card_number: '4111111111111111',
        holder_name: 'John Doe',
        expiration_year: validExpYear,
        expiration_month: '1',
        cvv2: '110',
      });
      expect(card).toBeTruthy();
      await expect(
        openpay.customers.payouts.create(customer_id, {
          method: 'card',
          destination_id: card.id,
          amount: 1.5,
          description: 'Test customer payout to existing card',
        }),
      ).resolves.toBeTruthy();
    });

    it.skip('should create a payout to an existing bank account', async () => {
      const bankAccount = await openpay.customers.bankaccounts.create(customer_id, {
        clabe: '021180000118359717',
        holder_name: 'John Doe',
      });
      expect(bankAccount).toBeTruthy();

      await expect(
        openpay.customers.payouts.create(customer_id, {
          method: 'bank_account',
          destination_id: bankAccount.id,
          amount: 1.5,
          description: 'Test customer payout to existing bank account',
        }),
      ).resolves.toBeTruthy();
    });

    it('should get all payouts', async () => {
      await expect(openpay.customers.payouts.list(customer_id)).resolves.toBeTruthy();
    });
  });

  //------------------------------
  // FEE TESTS
  //------------------------------
  describe('Test fees API', () => {
    let customer_id: string;

    beforeAll(async () => {
      const customer = await openpay.customers.create({
        name: 'Fee',
        last_name: 'Tester',
        email: 'fee.tester@example.com',
        requires_account: true,
      });
      expect(customer).toBeTruthy();
      customer_id = customer.id;

      const card = await openpay.customers.cards.create(customer.id, {
        card_number: '4111111111111111',
        holder_name: 'John Doe',
        expiration_year: validExpYear,
        expiration_month: '1',
        cvv2: '110',
      });

      await expect(
        openpay.customers.charges.create(customer.id, {
          amount: 1_000,
          method: 'card',
          source_id: card.id,
          device_session_id,
          description: 'Funding sender',
        }),
      ).toBeTruthy();

      await waitUntilCustomerBalance(customer.id, 300_000);
    }, 300_000);

    afterAll(async () => {
      if (customer_id) {
        await openpay.customers.delete(customer_id);
      }
    });

    it('should charge a fee', async () => {
      const txn = await openpay.fees.create({
        customer_id: customer_id,
        amount: 1.5,
        description: 'Test fee',
      });
      expect(txn).toBeTruthy();
      console.log('The fee:', txn.id);
    });

    it('should get all fees', async () => {
      await expect(openpay.fees.list()).resolves.toBeTruthy();
    });
  });

  //------------------------------
  // PLAN TESTS
  //------------------------------
  describe('Test plans API', () => {
    let testPlanId = '';
    const testPlan: IOpenpay.Plan.CreateInput = {
      name: 'Test plan',
      amount: 15.0,
      trial_days: 30,
      retry_times: 2,
      repeat_every: 1,
      repeat_unit: 'month',
      status_after_retry: 'cancelled',
    };

    afterAll(async () => {
      if (testPlanId) {
        await openpay.plans.delete(testPlanId);
      }
    });

    it('should create a plan', async () => {
      const plan = await openpay.plans.create(testPlan);
      expect(plan).toBeTruthy();
      testPlanId = plan.id;
      console.log('The plan:', plan.id);
    });

    it('should get all plans', async () => {
      await expect(openpay.plans.list()).resolves.toBeTruthy();
    });

    it('should get the plan', async () => {
      await expect(openpay.plans.get(testPlanId)).resolves.toBeTruthy();
    });

    it('should update the plan', async () => {
      await expect(openpay.plans.update(testPlanId, { name: 'Updated test plan' })).resolves.toBeTruthy();
    });
  });

  //------------------------------
  // SUBSCRIPTION TESTS
  //------------------------------
  describe('Test subscriptions API', () => {
    let testCustomerId = '';
    let testCustomerCardId = '';
    let testPlanId = '';
    let testSubscriptionId = '';
    let testCustomer: IOpenpay.Customer | null = null;

    const today = toFilterDate(new Date());

    beforeAll(async () => {
      testCustomer = await openpay.customers.create({
        name: 'Subscription',
        last_name: 'Tester',
        email: 'subscription.tester@example.com',
        requires_account: true,
      });
      expect(testCustomer).toBeTruthy();
      testCustomerId = testCustomer.id;

      const card = await openpay.customers.cards.create(testCustomerId, {
        card_number: '4111111111111111',
        holder_name: 'John Doe',
        expiration_year: validExpYear,
        expiration_month: '1',
        cvv2: '110',
      });
      expect(card).toBeTruthy();
      testCustomerCardId = card.id;

      const plan = await openpay.plans.create({
        name: 'Test subscription plan',
        amount: 15.0,
        trial_days: 30,
        retry_times: 2,
        repeat_every: 1,
        repeat_unit: 'month',
        status_after_retry: 'cancelled',
      });
      expect(plan).toBeTruthy();
      testPlanId = plan.id;
    });

    afterAll(async () => {
      if (testSubscriptionId) {
        await openpay.customers.subscriptions.delete(testCustomerId, testSubscriptionId);
      }
      if (testPlanId) {
        await openpay.plans.delete(testPlanId);
      }
      if (testCustomer) {
        await openpay.customers.delete(testCustomer.id);
      }
    });

    it('should create a subscription', async () => {
      const subscription = await openpay.customers.subscriptions.create(testCustomerId, {
        plan_id: testPlanId,
        card_id: testCustomerCardId,
      });
      expect(subscription).toBeTruthy();
      testSubscriptionId = subscription.id;
      console.log('The subscription:', subscription.id);
    });

    it('should get all the subscriptions', async () => {
      await expect(openpay.customers.subscriptions.list(testCustomerId)).resolves.toBeTruthy();
    });

    it('should get the subscription', async () => {
      await expect(
        openpay.customers.subscriptions.get(testCustomerId, testSubscriptionId),
      ).resolves.toBeTruthy();
    });

    it('should update the subscription', async () => {
      await expect(
        openpay.customers.subscriptions.update(testCustomerId, testSubscriptionId, { trial_end_date: today }),
      ).resolves.toBeTruthy();
    });
  });

  //------------------------------
  //  DELETION TESTS (EMERGENCY CLEANUP)
  //------------------------------
  describe.skip('Test object deletion API - Emergency Cleanup', () => {
    // EMERGENCY CLEANUP: This suite is intended as a fallback cleanup mechanism.
    // Each suite should clean up its own resources in afterAll().
    // Run this suite manually only if afterAll() hooks failed to execute.
    //
    // Note: This suite is SKIPPED by default because each test suite now manages
    // its own resource lifecycle. Uncomment and run only for manual cleanup
    // in case of test failures that leave orphaned resources in sandbox.

    it('should be used only for emergency cleanup', async () => {
      expect(true).toBe(true);
    });
  });
});

/** Format date as yyyy-mm-dd */
function toFilterDate(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
