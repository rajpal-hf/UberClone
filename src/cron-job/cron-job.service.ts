// cron-job.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { Ride, RideDocument } from 'src/ride/schema/ride.schema';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class CronJobService {
	private readonly logger = new Logger(CronJobService.name);

	constructor(
		@InjectModel(Ride.name) private rideModel: Model<RideDocument>,
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		private readonly websocketGateway: WebsocketGateway, 
	) { }

	// Run every 30 seconds
	// @Cron('*/30 * * * * *')
	async checkScheduledRides() {
		const now = new Date();
		this.logger.log(`Cron Job: Checking for scheduled rides at ${now.toISOString()}`);

		// Find candidate rides (don't mark them locked yet)
		const candidates = await this.rideModel
			.find({
				status: 'scheduled',
				scheduledFor: { $lte: now },
				cronLocked: false,
			})
			.limit(50) // small batch size to avoid overloading DB
			.lean();

		if (!candidates || candidates.length === 0) {
			this.logger.debug('No scheduled rides due at this tick.');
			return;
		}

		for (const c of candidates) {
			try {
				// Atomically lock a single ride to avoid duplicate processing across instances
				const ride = await this.rideModel.findOneAndUpdate(
					{
						_id: c._id,
						cronLocked: false,
						status: 'scheduled',
					},
					{
						$set: { cronLocked: true, status: 'processing' },
					},
					{ new: true },
				);

				// If another instance already locked it, skip
				if (!ride) {
					this.logger.debug(`Ride ${c._id} already locked by another worker. Skipping.`);
					continue;
				}

				this.logger.log(`Triggering scheduled ride: ${ride._id}`);
				await this.processRide(ride);
			} catch (err) {
				this.logger.error('Ride schedule error:', err as any);
				// best effort: try to mark ride as failed and unlock
				try {
					await this.rideModel.findByIdAndUpdate(c._id, {
						$set: { status: 'failed', cronLocked: false },
					});
				} catch (e) {
					this.logger.error(`Failed to update ride ${c._id} after error: ${e}`);
				}
			}
		}
	}


	async processRide(ride: RideDocument) {
		try {
			
			const filter: any = {
				role: 'driver',
				isOnline: true,
				isAvailable: true, 
			};

			// if ride.vehicleType exists try to match (optional)
			if ((ride as any).vehicleType) {
				filter.vehicleType = (ride as any).vehicleType;
			}

			const driver = await this.authModel.findOne(filter).sort({ lastSeenAt: -1 }).lean();

			if (!driver) {
				const maxRetries = 5;
				const currentRetryCount = (ride as any).retryCount || 0;

				this.logger.warn(`No available driver found for scheduled ride ${ride._id}. Retry ${currentRetryCount + 1}/${maxRetries}`);
				
				// Update retry count and last retry time
				await this.rideModel.findByIdAndUpdate(ride._id, {
					$set: { 
						status: currentRetryCount >= maxRetries ? 'failed' : 'scheduled',
						cronLocked: false,
						retryCount: currentRetryCount + 1,
						lastRetryAt: new Date(),
					},
				});

				// Notify the rider
				if (ride.riderId) {
					const message = currentRetryCount >= maxRetries 
						? 'Unable to find a driver for your scheduled ride. Please try again later.'
						: 'No drivers available right now. We will keep trying.';
					
					this.websocketGateway.emitToUser(ride.riderId.toString(), 'ride:no-driver', {
						rideId: ride._id,
						message,
						retryCount: currentRetryCount + 1,
						maxRetries,
						isFinal: currentRetryCount >= maxRetries,
					});
				}

				return;
			}

			await this.rideModel.findByIdAndUpdate(ride._id, {
				$set: {
					driverId: new Types.ObjectId(driver._id),
					status: 'assigned',
					cronLocked: false,
					startTime: null,
				},
			});

			try {
				await this.authModel.updateOne({ _id: driver._id }, { $set: { isAvailable: false } });
			} catch (e) {
				this.logger.debug(`Could not mark driver ${driver._id} unavailable: ${e}`);
			}

			if (ride.riderId) {
				this.websocketGateway.emitToUser(ride.riderId.toString(), 'ride:assigned', {
					rideId: ride._id,
					driver: {
						id: driver._id,
						name: (driver as any).name,
						phone: (driver as any).phone,
						vehicle: (driver as any).vehicle || null,
					},
					message: 'Your scheduled ride has been assigned to a driver!',
				});
			}

			this.websocketGateway.emitToUser(driver._id.toString(), 'ride:assigned', {
				rideId: ride._id,
				pickupLocation: ride.pickupLocation,
				dropoffLocation: ride.dropoffLocation,
				riderId: ride.riderId,
				scheduledFor: (ride as any).scheduledFor,
				message: 'You have been assigned a scheduled ride!',
			});

			this.logger.log(`Ride ${ride._id} assigned to driver ${driver._id}`);
		} catch (err) {
			this.logger.error(`Error processing ride ${ride._id}:`, err as any);
			// On error, try to unlock and mark as failed so it doesn't remain locked forever
			try {
				await this.rideModel.findByIdAndUpdate(ride._id, {
					$set: { status: 'failed', cronLocked: false },
				});
			} catch (e) {
				this.logger.error(`Failed to update ride ${ride._id} after processing error: ${e}`);
			}
		}
	}

	// Send reminders for upcoming scheduled rides (run every 5 minutes)
	@Cron('*/5 * * * *')
	async sendScheduleReminders() {
		const now = new Date();
		const reminderWindow = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
		const maxReminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

		this.logger.log(`Cron Job: Checking for rides needing reminders between ${reminderWindow.toISOString()} and ${maxReminderTime.toISOString()}`);

		try {
			// Find rides scheduled in the next 10-15 minutes that haven't been reminded yet
			const ridesToRemind = await this.rideModel.find({
				status: 'scheduled',
				scheduledFor: { 
					$gte: reminderWindow, 
					$lte: maxReminderTime 
				},
				reminderSent: false,
			}).lean();

			if (!ridesToRemind || ridesToRemind.length === 0) {
				this.logger.debug('No rides need reminders at this time.');
				return;
			}

			for (const ride of ridesToRemind) {
				try {
					// Mark reminder as sent
					await this.rideModel.findByIdAndUpdate(ride._id, {
						$set: { reminderSent: true },
					});

					// Send reminder to rider
					if (ride.riderId) {
						const minutesUntil = Math.round(
							((ride as any).scheduledFor.getTime() - now.getTime()) / (60 * 1000)
						);

						this.websocketGateway.emitToUser(ride.riderId.toString(), 'ride:schedule-reminder', {
							rideId: ride._id,
							scheduledFor: (ride as any).scheduledFor,
							minutesUntil,
							message: `Your ride is scheduled in ${minutesUntil} minutes. We'll assign a driver shortly.`,
							pickupLocation: ride.pickupLocation,
							dropoffLocation: ride.dropoffLocation,
						});

						this.logger.log(`Sent reminder for ride ${ride._id} to rider ${ride.riderId}`);
					}
				} catch (err) {
					this.logger.error(`Failed to send reminder for ride ${ride._id}:`, err);
				}
			}
		} catch (err) {
			this.logger.error('Error in sendScheduleReminders cron:', err);
		}
	}
}


// import {  Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Cron } from '@nestjs/schedule';
// import { Ride, RideDocument } from 'src/ride/schema/ride.schema';

// @Injectable()
// export class CronJobService {
// 	constructor(@InjectModel(Ride.name) private rideModel: Model<RideDocument>) { }

// 		@Cron ('*/30 * * * * *') // every 30 seconds
// 		async checkScheduledRides() {
// 			const now = new Date();
			
// 			console.log("Cron Job: Checking for scheduled rides at", now);

// 		// Find rides whose time has arrived and not processed yet
// 		const rides = await this.rideModel.find({
// 			status: 'scheduled',
// 			pickupTime: { $lte: now },
// 			cronLocked: false
// 		});

// 		for (const ride of rides) {
// 			try {
// 				ride.cronLocked = true;
// 				ride.status = 'processing';
// 				await ride.save();
// 				console.log(`Triggering scheduled ride: ${ride._id}`);
// 				await this.processRide(ride);
// 			} catch (err) {
// 				console.error('Ride schedule error:', err);
// 				ride.status = 'failed';
// 				ride.cronLocked = false;
// 				await ride.save();
// 			}
// 		}
// 	}

// 	async processRide(ride) {

// 		// complete this function with ride processing logic

// 		// Driver assignment logic here
// 		// Example:
// 		// await this.driverService.assignDriver(ride)

// 		// After assigned:
// 		ride.status = 'assigned';
// 		ride.cronLocked = false;
// 		await ride.save();

// 		// Notify user or driver:
// 		// this.notificationService.send(...)
// 	}
// }
// function checkScheduledRides() {
// 	// complete this function
// 	throw new Error('Function not implemented.');
// }

