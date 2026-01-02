// Dashboard

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

function loadDashboardData() {
    const user = auth.currentUser;
    if (!user) return;

    // Load total patients
    db.collection('patients').where('caretakerId', '==', user.uid)
        .onSnapshot((snapshot) => {
            document.getElementById('totalPatients').textContent = snapshot.size;
        });

    // Load active alerts (placeholder)
    document.getElementById('activeAlerts').textContent = '0';

    // Load recent activity (placeholder)
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '<li>System initialized</li>';
}