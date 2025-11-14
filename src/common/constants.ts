export enum UserRole {
	ADMIN = 'admin',
	RIDER = 'rider',
	DRIVER = 'driver'
}


export enum VehicleType {
	AUTO = "auto",
	BIKE = "bike",
	CAR = "car"
}


export enum VerficationSTATUS{
	PENDING = "pending",	
	VERIFIED = "verified",
	REJECTED = "rejected"
}


export enum DriverStatus {
	ONLINE = "online",
	OFFLINE = "offline",
	ON_TRIP = "on_trip"
}

export enum RideCancelBy {
	DRIVER = "driver",
	RIDER = "rider"
}
