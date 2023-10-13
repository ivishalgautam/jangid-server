/**
 * The haversine function calculates the distance between two points on the Earth's surface using their
 * latitude and longitude coordinates.
 * @param lat1 - The latitude of the first point in degrees.
 * @param lon1 - The parameter `lon1` represents the longitude of the first location.
 * @param lat2 - The parameter "lat2" represents the latitude of the second location.
 * @param lon2 - The parameter "lon2" represents the longitude of the second location.
 * @returns the distance between two points on the Earth's surface in kilometers.
 */
function haversine(lat1, lon1, lat2, lon2) {
  const radius = 6371; // Radius of the Earth in kilometers

  // Convert latitude and longitude from degrees to radians
  lat1 = (Math.PI / 180) * lat1;
  lon1 = (Math.PI / 180) * lon1;
  lat2 = (Math.PI / 180) * lat2;
  lon2 = (Math.PI / 180) * lon2;

  // Haversine formula
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = radius * c;

  return distance;
}

module.exports = { haversine };
