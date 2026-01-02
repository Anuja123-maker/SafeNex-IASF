// ===============================
// Patient Management - Safenex
// ===============================

// Wait for auth state to be ready
auth.onAuthStateChanged((user) => {
    if (!user) {
        // Safety redirect (extra protection)
        globalThis.location.replace("login.html");
        return;
    }

    console.log('Auth state changed: uid =', user && user.uid);

    // Load patients only after auth is confirmed
    loadPatients(user.uid);

    const form = document.getElementById("patientForm");
    if (form) {
        form.addEventListener("submit", (e) => savePatient(e, user.uid));
    }
});

// -------------------------------
// Save Patient
// -------------------------------
function savePatient(e, caretakerId) {
    e.preventDefault();

    const name = document.getElementById("pName").value.trim();
    const age = Number.parseInt(document.getElementById("pAge").value, 10);
    const condition = document.getElementById("pCondition").value.trim();
    const emergencyContact = document.getElementById("pEmergencyContact").value.trim();
    const deviceId = document.getElementById("pDeviceId").value.trim();

    if (!name || !Number.isFinite(age) || !condition || !emergencyContact || !deviceId) {
        alert("Please fill all fields (ensure age is a number)");
        return;
    }

    db.collection("patients")
        .add({
            caretakerId: caretakerId,
            name: name,
            age: age,
            medicalCondition: condition,
            emergencyContact: emergencyContact,
            deviceId: deviceId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then((docRef) => {
            console.log("Patient saved, id=", docRef.id);
            alert("Patient saved successfully");

            const formEl = document.getElementById("patientForm");

            // Insert card into the list immediately so user sees it even if snapshot is delayed
            const list = document.getElementById("patientList");
            if (list) {
                // If there is a 'No patients' message and no cards, clear it
                if (list.querySelector('p') && !list.querySelector('.patient-card')) {
                    list.innerHTML = '';
                }

                // Prefer matching by deviceId to avoid duplicates if the same patient was saved twice
                const existingByDevice = deviceId ? list.querySelector(`[data-device="${deviceId}"]`) : null;
                const existingById = list.querySelector(`[data-id="${docRef.id}"]`);

                if (existingById) {
                    existingById.innerHTML = `
                        <div class="patient-header">
                            <h3>${name}</h3>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/qr.html?patientId=${docRef.id}`)}" alt="QR Code" class="patient-qr-preview" onclick="openFullQR('${docRef.id}', '${name}')">
                        </div>
                        <p><strong>Age:</strong> ${age}</p>
                        <p><strong>Condition:</strong> ${condition}</p>
                        <p><strong>Emergency:</strong> ${emergencyContact}</p>
                        <p><strong>Device ID:</strong> ${deviceId}</p>
                        <button onclick="generatePatientQR('${docRef.id}')">View Full QR Code</button>
                    `;
                    list.insertBefore(existingById, list.firstChild);
                } else if (existingByDevice) {
                    // Update existing card that shares the same deviceId
                    existingByDevice.dataset.id = docRef.id;
                    existingByDevice.innerHTML = `
                        <div class="patient-header">
                            <h3>${name}</h3>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/qr.html?patientId=${docRef.id}`)}" alt="QR Code" class="patient-qr-preview" onclick="openFullQR('${docRef.id}', '${name}')">
                        </div>
                        <p><strong>Age:</strong> ${age}</p>
                        <p><strong>Condition:</strong> ${condition}</p>
                        <p><strong>Emergency:</strong> ${emergencyContact}</p>
                        <p><strong>Device ID:</strong> ${deviceId}</p>
                        <button onclick="generatePatientQR('${docRef.id}')">View Full QR Code</button>
                    `;
                    list.insertBefore(existingByDevice, list.firstChild);
                } else {
                    const div = document.createElement('div');
                    div.className = 'patient-card';
                    div.dataset.id = docRef.id;
                    div.dataset.device = deviceId;
                    div.innerHTML = `
                        <div class="patient-header">
                            <h3>${name}</h3>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/qr.html?patientId=${docRef.id}`)}" alt="QR Code" class="patient-qr-preview" onclick="openFullQR('${docRef.id}', '${name}')">
                        </div>
                        <p><strong>Age:</strong> ${age}</p>
                        <p><strong>Condition:</strong> ${condition}</p>
                        <p><strong>Emergency:</strong> ${emergencyContact}</p>
                        <p><strong>Device ID:</strong> ${deviceId}</p>
                        <button onclick="generatePatientQR('${docRef.id}')">View Full QR Code</button>
                    `;

                    // Add to top
                    list.insertBefore(div, list.firstChild);
                }
            }

            // Reset the form
            if (formEl) formEl.reset();
        })
        .catch((error) => {
            console.error("Firestore Error:", error);
            alert(error.message);
        });
}

// -------------------------------
// Load Patients
// -------------------------------
function loadPatients(caretakerId) {
    const list = document.getElementById("patientList");
    if (!list) return;

    // show loading state while we attach snapshot listener
    list.innerHTML = '<p>Loading patients…</p>';
    console.log('Loading patients for caretakerId =', caretakerId);

    db.collection("patients")
        .where("caretakerId", "==", caretakerId)
        .orderBy("createdAt", "desc")
        .onSnapshot(
            (snapshot) => {
                console.log('Patients snapshot received. size =', snapshot.size, 'docIds =', snapshot.docs.map(d => d.id));
                list.innerHTML = "";

                if (snapshot.empty) {
                    list.innerHTML = "<p>No patients added yet.</p>";
                    updatePatientPreview(null);
                    return;
                }

                // Deduplicate by deviceId so identical entries aren't shown multiple times
                const seenDeviceIds = new Set();
                snapshot.forEach((doc) => {
                    const patient = doc.data();
                    const id = doc.id;
                    const device = patient.deviceId || '';

                    if (device && seenDeviceIds.has(device)) {
                        // skip duplicate device entries (we keep the first/newest)
                        return;
                    }

                    if (device) seenDeviceIds.add(device);

                    const div = document.createElement("div");
                    div.className = "patient-card";
                    div.dataset.id = id;
                    div.dataset.device = device;
                    const qrUrl = `${window.location.origin}/qr.html?patientId=${id}`;
                    const smallQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}`;
                    div.innerHTML = `
                        <div class="patient-header">
                            <h3>${patient.name}</h3>
                            <img src="${smallQrSrc}" alt="QR Code" class="patient-qr-preview" onclick="openFullQR('${id}', '${patient.name}')">
                        </div>
                        <p><strong>Age:</strong> ${patient.age}</p>
                        <p><strong>Condition:</strong> ${patient.medicalCondition}</p>
                        <p><strong>Emergency:</strong> ${patient.emergencyContact}</p>
                        <p><strong>Device ID:</strong> ${patient.deviceId}</p>
                        <button onclick="generatePatientQR('${id}')">View Full QR Code</button>
                    `;
                    list.appendChild(div);
                });
            },
            (error) => {
                console.error("Snapshot Error:", error);
                alert(error.message);
            }
        );
}

// Preview removed: Saved Patient preview has been removed from the UI; we now display saved patients only as cards.

// -------------------------------
// Generate QR for Patient
// -------------------------------
function generatePatientQR(patientId) {
    window.location.href = `qr.html?patientId=${patientId}`;
}

// -------------------------------
// Open Full QR for Printing
// -------------------------------
function openFullQR(patientId, patientName) {
    const qrUrl = `${window.location.origin}/qr.html?patientId=${patientId}`;
    const largeQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrUrl)}`;
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Code for ${patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                img { max-width: 100%; height: auto; }
                .print-btn { 
                    margin-top: 20px; 
                    padding: 10px 20px; 
                    background: #800080; 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer; 
                }
                .print-btn:hover { background: #600060; }
            </style>
        </head>
        <body>
            <h2>Emergency QR Code for ${patientName}</h2>
            <p>Print this QR code and attach it to the patient's device.</p>
            <img src="${largeQrSrc}" alt="QR Code for ${patientName}">
            <br>
            <button class="print-btn" onclick="window.print()">Print QR Code</button>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// -------------------------------
// Delete Patient
// -------------------------------
function deletePatient(id) {
    if (!confirm("Are you sure you want to delete this patient?")) return;

    db.collection("patients")
        .doc(id)
        .delete()
        .then(() => {
            alert("Patient deleted successfully");
        })
        .catch((error) => {
            console.error("Delete Error:", error);
            alert(error.message);
        });
}


