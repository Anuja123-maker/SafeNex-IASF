// Authentication Functions

// Register User
function registerUser() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;

    if (!name || !email || !password) {
        alert('Please fill all fields');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Save caretaker details to Firestore (optional)
            const user = userCredential.user;
            db.collection('caretakers').doc(user.uid).set({
                name: name,
                email: email,
                phone: '',
                relation: 'Primary Caretaker',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch((error) => {
                console.log('Firestore save failed:', error);
            });
            // Always redirect after user creation
            alert('Registration successful!');
            window.location.href = 'login.html';
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

// Login User
function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Redirect after successful login
            window.location.href = 'patient.html';
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

// Logout
function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            alert('Error logging out: ' + error.message);
        });
}

// Check Auth State
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User signed in:', user.uid);
    } else {
        // User is signed out
        if (window.location.pathname.includes('dashboard.html') ||
            window.location.pathname.includes('patient.html') ||
            window.location.pathname.includes('caretaker.html') ||
            window.location.pathname.includes('map.html') ||
            window.location.pathname.includes('qr.html')) {
            window.location.href = 'login.html';
        }
    }
});