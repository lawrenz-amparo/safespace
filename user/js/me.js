// sidebar.js
async function loadUserProfile() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Check if user data exists in localStorage
    const cachedUser = localStorage.getItem('userData');
    const cachedTimestamp = localStorage.getItem('userDataTimestamp');
    const now = Date.now();
    
    // Use cached data if it's less than 5 minutes old (300000 ms)
    if (cachedUser && cachedTimestamp && (now - parseInt(cachedTimestamp)) < 300000) {
        const userData = JSON.parse(cachedUser);
        updateUI(userData);
        return;
    }

    try {
        const response = await fetch('https://safespace-back.onrender.com/api/v1/user/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Store user data in localStorage with timestamp
            localStorage.setItem('userData', JSON.stringify(data.data));
            localStorage.setItem('userDataTimestamp', Date.now().toString());
            updateUI(data.data);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateUI(userData) {
    // Update sidebar (existing functionality)
    const sidebarFullName = document.getElementById('sidebarFullName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    if (sidebarFullName) sidebarFullName.textContent = userData.fullName;
    if (sidebarEmail) sidebarEmail.textContent = userData.email;

    // NEW: Update welcome heading (if the span exists)
    const firstName = userData.fullName?.split(' ')[0] || 'User';
    const userFirstNameSpan = document.getElementById('userFirstName');
    if (userFirstNameSpan) userFirstNameSpan.textContent = firstName;
}

// Clear cache on logout
function clearUserCache() {
    localStorage.removeItem('userData');
    localStorage.removeItem('userDataTimestamp');
}

document.addEventListener('DOMContentLoaded', loadUserProfile);