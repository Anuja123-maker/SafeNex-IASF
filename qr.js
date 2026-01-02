// QR Code Generation

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');

    if (patientId) {
        // Display patient and caretaker details (allow without auth for emergency)
        displayPatientDetails(patientId);
    } else {
        // Check auth for QR generation
        auth.onAuthStateChanged((user) => {
            if (!user) {
                globalThis.location.replace("login.html");
                return;
            }
            loadPatientsForQR();
        });
    }
});

function loadPatientsForQR() {
    const user = auth.currentUser;
    if (!user) return;

    const select = document.getElementById('patientSelect');
    if (!select) return;

    db.collection('patients').where('caretakerId', '==', user.uid)
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const patient = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = patient.name;
                select.appendChild(option);
            });
        });
}

function displayPatientDetails(patientId) {
    // Hide the form and show details
    document.querySelector('.qr-section').innerHTML = '<h1>Patient Emergency Information</h1><div id="emergencyInfo"></div>';

    db.collection('patients').doc(patientId).get()
        .then((patientDoc) => {
            if (!patientDoc.exists) {
                document.getElementById('emergencyInfo').innerHTML = '<p>Patient not found.</p>';
                return;
            }

            const patient = patientDoc.data();
            const caretakerId = patient.caretakerId;

            // Fetch caretaker details
            db.collection('caretakers').doc(caretakerId).get()
                .then((caretakerDoc) => {
                    const caretaker = caretakerDoc.exists ? caretakerDoc.data() : null;

                    const infoDiv = document.getElementById('emergencyInfo');
                    infoDiv.innerHTML = `
                        <div class="emergency-banner">
                            <h2>🚨 Emergency Contact Information</h2>
                        </div>
                        <div class="info-section">
                            <h3>Patient Details</h3>
                            <p><strong>Name:</strong> ${patient.name}</p>
                            <p><strong>Age:</strong> ${patient.age}</p>
                            <p><strong>Medical Condition:</strong> ${patient.medicalCondition}</p>
                            <p><strong>Emergency Contact:</strong> ${patient.emergencyContact}</p>
                            <p><strong>Device ID:</strong> ${patient.deviceId}</p>
                        </div>
                        ${caretaker ? `
                        <div class="info-section">
                            <h3>Caretaker Details</h3>
                            <p><strong>Name:</strong> ${caretaker.name}</p>
                            <p><strong>Email:</strong> ${caretaker.email}</p>
                            <p><strong>Phone:</strong> ${caretaker.phone}</p>
                            <p><strong>Relation:</strong> ${caretaker.relation}</p>
                        </div>
                        ` : '<p>Caretaker information not available.</p>'}
                        <div class="emergency-actions">
                            <button onclick="callEmergency('${patient.emergencyContact}')">Call Emergency Contact</button>
                            ${caretaker ? `<button onclick="callCaretaker('${caretaker.phone}')">Call Caretaker</button>` : ''}
                        </div>
                    `;
                });
        })
        .catch((error) => {
            document.getElementById('emergencyInfo').innerHTML = '<p>Error loading information.</p>';
        });
}

function callEmergency(phone) {
    window.location.href = `tel:${phone}`;
}

function callCaretaker(phone) {
    window.location.href = `tel:${phone}`;
}

function generateQR() {
    const patientId = document.getElementById('patientSelect').value;
    if (!patientId) {
        alert('Please select a patient');
        return;
    }

    // Generate URL that will display patient and caretaker details
    const qrData = `${window.location.origin}/qr.html?patientId=${patientId}`;

    const qrBox = document.getElementById('qrBox');
    qrBox.innerHTML = '';

    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    qrBox.appendChild(qrImg);

    // Add download button
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download QR Code';
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = qrImg.src;
        link.download = 'patient-qr.png';
        link.click();
    };
    qrBox.appendChild(downloadBtn);
}
