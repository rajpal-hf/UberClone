export function calculateFare(distanceKm: number): number {
	const baseFare = 50; 
	const perKm = 12; 
	return baseFare + distanceKm * perKm;
}