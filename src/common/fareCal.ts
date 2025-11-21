export const typeWiseFare = {
	auto: 16,   // ₹ per km
	bike: 22,
	car: 53
};

export const typeWiseSpeed = {
	auto: 40,  // km/h
	bike: 65,
	car: 90
};

export function getDistanceInMeters(lat1, lon1, lat2, lon2) {
	const R = 6371000;
	const toRad = (value) => (value * Math.PI) / 180;

	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) *
		Math.cos(toRad(lat2)) *
		Math.sin(dLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));


	return R * c;
}

export const totalFare = (type, distanceInMeters) => {
	const km = distanceInMeters / 1000;
	return Math.ceil (typeWiseFare[type] * km);
};

export const totalTime = (type, distanceInMeters) => {
	console.log("distance and type", distanceInMeters, type)
	const km = distanceInMeters / 1000;
	const hour = km / typeWiseSpeed[type];
	console.log("hours and distance"	, hour)
	return Math.ceil(hour); // hour
};
