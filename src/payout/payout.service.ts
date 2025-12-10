// // payout.service.ts
// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { PayoutStatus } from './enums';

// @Injectable()
// export class PayoutService {
// 	constructor(
// 		// private readonly walletRepo: WalletRepository,
// 		// private readonly beneficiaryRepo: BeneficiaryRepository, // driver/vendor
// 		// private readonly payoutRepo: PayoutRepository,
// 		// private readonly gatewayPayoutClient: PayoutGatewayClient, // RazorpayX, Stripe Connect, etc.
// 	) { }

// 	async createPayout(params: {
// 		beneficiaryId: string;
// 		amount: number;
// 		currency: Currency;
// 		sourceType: 'RIDE' | 'ORDER' | 'MANUAL';
// 		sourceId: string;
// 		idempotencyKey: string;
// 	}): Promise<Payout> {
// 		const { beneficiaryId, amount, currency, sourceType, sourceId, idempotencyKey } = params;

// 		// 1. Check idempotency (avoid double payouts)
// 		const existing = await this.payoutRepo.findByIdempotencyKey(idempotencyKey);
// 		if (existing) return existing;

// 		// 2. Load beneficiary
// 		const beneficiary = await this.beneficiaryRepo.findById(beneficiaryId);
// 		if (!beneficiary) {
// 			throw new NotFoundException('Beneficiary not found');
// 		}
// 		if (!beneficiary.isKycVerified) {
// 			// Edge case: KYC not done
// 			throw new BadRequestException('Beneficiary not KYC verified');
// 		}
// 		if (!beneficiary.bankAccount || !beneficiary.bankAccount.isVerified) {
// 			throw new BadRequestException('Beneficiary bank account not verified');
// 		}

// 		// 3. Validate amount
// 		if (amount <= 0) {
// 			throw new BadRequestException('Payout amount must be > 0');
// 		}

// 		// 4. Load wallet and check balance
// 		const wallet = await this.walletRepo.findByOwnerId(beneficiaryId);
// 		if (!wallet) throw new NotFoundException('Wallet not found');

// 		const availableBalance = wallet.balance - wallet.lockedBalance; // if you support "locked" funds
// 		if (amount > availableBalance) {
// 			// Edge case: insufficient balance
// 			throw new BadRequestException('Insufficient wallet balance');
// 		}

// 		// 5. Lock funds in wallet (atomic transaction)
// 		// In real code: wrap in DB transaction / optimistic lock
// 		wallet.lockedBalance += amount;
// 		await this.walletRepo.save(wallet);

// 		// 6. Create payout record in DB as CREATED
// 		let payout = await this.payoutRepo.create({
// 			beneficiaryId,
// 			amount,
// 			currency,
// 			status: PayoutStatus.CREATED,
// 			sourceType,
// 			sourceId,
// 			idempotencyKey,
// 		});

// 		// 7. Call gateway
// 		try {
// 			const gatewayRes = await this.gatewayPayoutClient.createPayout({
// 				beneficiaryExternalId: beneficiary.gatewayContactId, // e.g. RazorpayX Contact
// 				amount,
// 				currency,
// 				referenceId: payout._id.toString(),
// 				idempotencyKey,
// 			});

// 			payout.gatewayPayoutId = gatewayRes.id;
// 			payout.status = PayoutStatus.PROCESSING;
// 			await this.payoutRepo.save(payout);

// 			// 8. Move lockedBalance → decrease balance immediately
// 			wallet.balance -= amount;
// 			wallet.lockedBalance -= amount;
// 			await this.walletRepo.save(wallet);

// 			return payout;
// 		} catch (err) {
// 			// EDGE CASE: gateway API call failed (validation or network)
// 			payout.status = PayoutStatus.FAILED;
// 			await this.payoutRepo.save(payout);

// 			// Unlock funds (revert lock)
// 			wallet.lockedBalance -= amount;
// 			await this.walletRepo.save(wallet);

// 			throw new BadRequestException('Failed to initiate payout with gateway');
// 		}
// 	}

// 	// Webhook from gateway for payout status updates
// 	async handlePayoutWebhook(payload: any) {
// 		const gatewayPayoutId = payload.payoutId;
// 		const statusFromGateway = payload.status; // "processed", "failed", "reversed", etc.

// 		const payout = await this.payoutRepo.findByGatewayPayoutId(gatewayPayoutId);
// 		if (!payout) {
// 			// Edge case: unknown payout, ignore or log
// 			return;
// 		}

// 		const wallet = await this.walletRepo.findByOwnerId(payout.beneficiaryId);
// 		if (!wallet) {
// 			// Should not happen ideally
// 			return;
// 		}

// 		if (statusFromGateway === 'processed' || statusFromGateway === 'succeeded') {
// 			payout.status = PayoutStatus.SUCCESS;
// 			await this.payoutRepo.save(payout);

// 			// Wallet already deducted at creation time.
// 			// Just log / notify beneficiary.

// 		} else if (statusFromGateway === 'failed') {
// 			payout.status = PayoutStatus.FAILED;
// 			payout.failureCode = payload.failureCode;
// 			payout.failureMessage = payload.failureMessage;
// 			await this.payoutRepo.save(payout);

// 			// Edge case: gateway did not send reversal, but never debited:
// 			// You may need to re-credit wallet if you had deducted earlier.
// 			// Here we assume money never left, but to be safe:
// 			wallet.balance += payout.amount; // refund back to wallet
// 			await this.walletRepo.save(wallet);

// 		} else if (statusFromGateway === 'reversed') {
// 			// Money was sent then came back (e.g. invalid account)
// 			payout.status = PayoutStatus.REVERSED;
// 			payout.failureCode = payload.failureCode;
// 			payout.failureMessage = payload.failureMessage;
// 			await this.payoutRepo.save(payout);

// 			// VERY IMPORTANT: credit back to wallet
// 			wallet.balance += payout.amount;
// 			await this.walletRepo.save(wallet);
// 		}
// 	}
// }
