// ----------- LOGIN SYSTEM -----------
function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;

    const storedUser = JSON.parse(localStorage.getItem("safenexUser"));

    if (!storedUser) {
        alert("No account found. Please Sign Up first.");
        return;
    }

    if (email === storedUser.email && pass === storedUser.password) {
        window.location.href = "patient-details.html";
    } else {
        alert("Incorrect Email or Password.");
    }
}

function registerUser() {
    const user = {
        name: document.getElementById("regName").value,
        email: document.getElementById("regEmail").value,
        password: document.getElementById("regPass").value
    };

    localStorage.setItem("safenexUser", JSON.stringify(user));
    alert("Account Created Successfully!");
    window.location.href = "login.html";
}


// ----------- PATIENT DETAILS -----------
function savePatientDetails() {
    const details = {
        name: document.getElementById("pName").value,
        age: document.getElementById("pAge").value,
        blood: document.getElementById("pBlood").value,
        condition: document.getElementById("pCondition").value,
        address: document.getElementById("pAddress").value
    };

    localStorage.setItem("patientDetails", JSON.stringify(details));
    window.location.href = "guardian-details.html";
}


// ----------- GUARDIAN DETAILS -----------
function saveGuardianDetails() {
    const guardian = {
        gName: document.getElementById("gName").value,
        gPhone: document.getElementById("gPhone").value,
        gRelation: document.getElementById("gRelation").value
    };

    localStorage.setItem("guardianDetails", JSON.stringify(guardian));
    window.location.href = "qr-page.html";
}


// ----------- QR GENERATION -----------
function generateQR() {
    const p = JSON.parse(localStorage.getItem("patientDetails"));
    const g = JSON.parse(localStorage.getItem("guardianDetails"));

    if (!p || !g) {
        alert("Missing details!");
        return;
    }

    const qrData = `
Name: ${p.name}
Age: ${p.age}
Blood Group: ${p.blood}
Condition: ${p.condition}
Address: ${p.address}
Guardian: ${g.gName}
Phone: ${g.gPhone}
Relation: ${g.gRelation}
    `;

    const qrBox = document.getElementById("qrBox");
    qrBox.innerHTML = "";

    const qrImg = document.createElement("img");
    qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(qrData);

    qrBox.appendChild(qrImg);
}
