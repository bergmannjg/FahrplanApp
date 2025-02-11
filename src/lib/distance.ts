
// see https://www.geodatasource.com/developers/javascript
// calculates the distance between two points in kilometers
export function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	if ((lat1 === lat2) && (lon1 === lon2)) {
		return 0;
	}
	else {
		const radlat1 = Math.PI * lat1 / 180;
		const radlat2 = Math.PI * lat2 / 180;
		const theta = lon1 - lon2;
		const radtheta = Math.PI * theta / 180;
		let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180 / Math.PI;
		dist = dist * 60 * 1.1515;
		dist = dist * 1.609344; // distance in km
		return dist;
	}
}

/**
 * see https://www.algorithms-and-technologies.com/point_in_polygon/javascript
 * Performs the even-odd-rule Algorithm (a raycasting algorithm) to find out whether a point is in a given polygon.
 * This runs in O(n) where n is the number of edges of the polygon.
 *
 * @param {Array} polygon an array representation of the polygon where polygon[i][0] is the x Value of the i-th point and polygon[i][1] is the y Value.
 * @param {Array} point   an array representation of the point where point[0] is its x Value and point[1] is its y Value
 * @return {boolean} whether the point is in the polygon (not on the edge, just turn < into <= and > into >= for that)
 */
function pointInPolygon(polygon: number[][], point: number[]) {
	//A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
	let odd = false;
	//For each edge (In this case for each point of the polygon and the previous one)
	for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
		//If a line from the point into infinity crosses this edge
		if (((polygon[i][1] > point[1]) !== (polygon[j][1] > point[1])) // One point needs to be above, one below our y coordinate
			// ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
			&& (point[0] < ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]))) {
			// Invert odd
			odd = !odd;
		}
		j = i;

	}
	//If the number of crossings was odd, the point is in the polygon
	return odd;
};

export function pointInArea(lat1: number, lon1: number, lat2: number, lon2: number, plat: number, plon: number): boolean {
	const polygon: number[][] = [[lat1, lon1], [lat2, lon1], [lat2, lon2], [lat1, lon2], ]
	return pointInPolygon(polygon, [plat, plon]);
}
