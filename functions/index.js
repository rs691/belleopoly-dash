
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {defineString} = require("firebase-functions/params");
const {Client} = require("@googlemaps/google-maps-services-js");
const admin = require("firebase-admin");

admin.initializeApp();

const mapsApiKey = defineString("GOOGLE_MAPS_API_KEY");

exports.geocodeAddress = onDocumentWritten("businesses/{businessId}", async (event) => {
  const snapshot = event.data.after;
  const businessData = snapshot.data();

  // If the lat/lng already exist, or the address hasn't changed, do nothing.
  if (businessData.lat && businessData.lng) {
    console.log("Location already exists, skipping geocoding.");
    return null;
  }
  
  const address = businessData.address;
  if (!address) {
    console.log("No address provided, skipping geocoding.");
    return null;
  }

  const mapsClient = new Client({});
  
  try {
    const response = await mapsClient.geocode({
      params: {
        address: address,
        key: mapsApiKey.value(),
      },
      timeout: 1000, // milliseconds
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      // Update the document with the new lat/lng.
      return snapshot.ref.update({
        lat: location.lat,
        lng: location.lng,
      });
    } else {
      console.log("Geocoding failed: No results found for address:", address);
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  
  return null;
});
