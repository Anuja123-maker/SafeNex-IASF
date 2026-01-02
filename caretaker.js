// ===============================
// Caretaker Management - Safenex
// ===============================

auth.onAuthStateChanged((user) => {
    if (!user) {
        globalThis.location.replace("login.html");
        return;
    }

    loadCaretakerProfile(user.uid);
    renderCaretakerCard(user.uid);

    const form = document.getElementById("caretakerForm");
    if (form) {
        form.addEventListener("submit", (e) => saveCaretaker(e, user.uid));
    }
});

// -------------------------------
// Save Caretaker
// -------------------------------
function saveCaretaker(e, caretakerId) {
    e.preventDefault();

    const name = document.getElementById("cName").value.trim();
    const email = document.getElementById("cEmail").value.trim();
    const phone = document.getElementById("cPhone").value.trim();
    const relation = document.getElementById("cRelation").value.trim();

    if (!name || !email || !phone || !relation) {
        alert("Please fill all fields");
        return;
    }

    db.collection("caretakers")
        .doc(caretakerId)
        .set({
            name,
            email,
            phone,
            relation,
            uid: caretakerId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        .then(() => {
            alert("Caretaker saved successfully");
            renderCaretakerCard(caretakerId); // 🔥 refresh card
        })
        .catch((error) => {
            alert(error.message);
        });
}

// -------------------------------
// Load Caretaker into Form
// -------------------------------
function loadCaretakerProfile(caretakerId) {
    db.collection("caretakers")
        .doc(caretakerId)
        .get()
        .then((doc) => {
            if (!doc.exists) return;
            const data = doc.data();

            document.getElementById("cName").value = data.name || "";
            document.getElementById("cEmail").value = data.email || "";
            document.getElementById("cPhone").value = data.phone || "";
            document.getElementById("cRelation").value = data.relation || "";
        });
}

// -------------------------------
// Render Caretaker Card (BOTTOM)
// -------------------------------
function renderCaretakerCard(caretakerId) {
    const list = document.getElementById("caretakerList");
    if (!list) return;

    db.collection("caretakers")
        .doc(caretakerId)
        .onSnapshot((doc) => {
            if (!doc.exists) {
                list.innerHTML = "<p>No caretaker profile found.</p>";
                return;
            }

            const caretaker = doc.data();

            list.innerHTML = `
                <div class="caretaker-card">
                    <h3>${caretaker.name}</h3>
                    <p><strong>Email:</strong> ${caretaker.email}</p>
                    <p><strong>Phone:</strong> ${caretaker.phone}</p>
                    <p><strong>Relation:</strong> ${caretaker.relation}</p>
                </div>
            `;
        });
}

// Live preview update (does not block form submission)
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("caretakerForm");
    if (!form) return;

    const updatePreview = () => {
        document.getElementById("cvName").textContent = document.getElementById("cName").value || '—';
        document.getElementById("cvPhone").textContent = document.getElementById("cPhone").value || '—';
        document.getElementById("cvRelation").textContent = document.getElementById("cRelation").value || '—';
    };

    form.addEventListener("input", updatePreview);
    updatePreview();
});
