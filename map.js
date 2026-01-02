// ===============================
// Map & Live Location Tracking
// ===============================

let map;
let markers = {};
let geofenceCircle;

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    initMap();
    loadAndTrackPatients(user.uid);
});

// -------------------------------
// Initialize Google Map
// -------------------------------
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // India default
        zoom: 14
    });
}

// -------------------------------
// Auto-load patients for caretaker
// -------------------------------
function loadAndTrackPatients(caretakerId) {
    db.collection("patients")
        .where("caretakerId", "==", caretakerId)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                alert("No patient found for this caretaker");
                return;
            }

            snapshot.forEach((doc) => {
                trackPatient(doc.id);
            });
        })
        .catch((error) => {
            console.error("Patient Load Error:", error);
        });
}

// -------------------------------
// Track Patient Location (Realtime DB)
// -------------------------------
function trackPatient(patientId) {
    const patientRef = rtdb.ref("locations/" + patientId);

    patientRef.on("value", (snapshot) => {
        const location = snapshot.val();
        if (!location) return;

        const pos = new google.maps.LatLng(location.lat, location.lng);

        if (markers[patientId]) {
            markers[patientId].setPosition(pos);
        } else {
            markers[patientId] = new google.maps.Marker({
                position: pos,
                map: map,
                title: "Patient Location"
            });
        }

        map.setCenter(pos);
        checkGeofence(patientId, location);
    });
}

// -------------------------------
// Geofence Check
// -------------------------------
function checkGeofence(patientId, location) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection("geofences")
        .doc(`${user.uid}_${patientId}`)
        .get()
        .then((doc) => {
            if (!doc.exists) return;

            const geofence = doc.data();
            const distance = getDistance(
                location.lat,
                location.lng,
                geofence.lat,
                geofence.lng
            );

            if (distance > geofence.radius) {
                showAlert("Patient is outside the safe zone!");
            }
        });
}

// -------------------------------
// Distance Calculation
// -------------------------------
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// -------------------------------
// Alert Display
// -------------------------------
function showAlert(message) {
    const alertsDiv = document.getElementById("alerts");
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert";
    alertDiv.textContent = message;
    alertsDiv.appendChild(alertDiv);
}
