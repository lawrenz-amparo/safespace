// Configure physics toast
if (typeof toast !== 'undefined') {
    toast.defaults = {
        position: 'top-right',
        duration: 4000,
        showProgress: true,
        pauseOnHover: true,
        spring: true
    };
}

// Chart instances
let lineChart = null;
let barChart = null;
let monthlyChart = null;
let categoryChart = null;
let offenseChart = null;
let locationChart = null;   // for location hotspot bar chart

// Helper Functions
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    if (typeof toast !== 'undefined') toast.success('Logged out', 'You have been successfully logged out.');
    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
}

function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        if (typeof toast !== 'undefined') toast.warning('Authentication required', 'Please log in to continue.');
        setTimeout(() => { window.location.href = '/login.html'; }, 2000);
        return false;
    }
    return true;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function updateSidebarInfo() {
    const token = getAuthToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.email) document.getElementById('sidebarEmail').innerText = payload.email;
            if (payload.fullName) document.getElementById('sidebarFullName').innerText = payload.fullName;
        } catch(e) {}
    }
}

// Render stat cards
function renderStats(data) {
    const statsContainer = document.getElementById('statsContainer');
    const summary = data.summary;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs text-[#8F7E7E] uppercase tracking-wider">Total reports</p>
                    <p class="text-2xl md:text-3xl font-semibold text-[#2A2424] mt-1">${formatNumber(summary.totalReports)}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-up-muted flex items-center justify-center text-up">
                    <i class="fas fa-flag"></i>
                </div>
            </div>
            <div class="flex items-center gap-2 mt-2">
                <span class="trend-neutral"><i class="fas fa-chart-line text-[0.6rem] mr-0.5"></i> total filed</span>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs text-[#8F7E7E] uppercase tracking-wider">Pending reports</p>
                    <p class="text-2xl md:text-3xl font-semibold text-[#2A2424] mt-1">${formatNumber(summary.pendingReports)}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            <div class="flex items-center gap-2 mt-2">
                <span class="trend-neutral">awaiting review</span>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs text-[#8F7E7E] uppercase tracking-wider">Registered users</p>
                    <p class="text-2xl md:text-3xl font-semibold text-[#2A2424] mt-1">${formatNumber(summary.registeredUsers)}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-up-muted flex items-center justify-center text-up">
                    <i class="fas fa-users"></i>
                </div>
            </div>
            <div class="flex items-center gap-2 mt-2">
                <span class="trend-neutral">total accounts</span>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs text-[#8F7E7E] uppercase tracking-wider">Appointments</p>
                    <p class="text-2xl md:text-3xl font-semibold text-[#2A2424] mt-1">${formatNumber(summary.totalAppointments)}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-up-muted flex items-center justify-center text-up">
                    <i class="fas fa-calendar-check"></i>
                </div>
            </div>
            <div class="flex items-center gap-2 mt-2">
                <span class="trend-neutral">total scheduled</span>
            </div>
        </div>
    `;
}

// Render Cases by Category
function renderCasesByCategory(casesByCategory) {
    const container = document.getElementById('casesByCategoryContainer');
    const categories = Object.entries(casesByCategory);
    const total = categories.reduce((sum, [_, count]) => sum + count, 0);
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="text-center py-8"><p class="text-sm text-gray-500">No category data available</p></div>';
        return;
    }
    
    // Generate colors for the chart
    const colors = [
        '#6F1A1F', '#8E3A3F', '#B16E72', '#D6A2A5', 
        '#E4BCBE', '#F1E4E5', '#9B5E62', '#C28488'
    ];
    
    const labels = categories.map(([category]) => category);
    const data = categories.map(([_, count]) => count);
    const backgroundColors = colors.slice(0, categories.length);
    
    container.innerHTML = `
        <div class="flex flex-col items-center">
            <div class="doughnut-container">
                <canvas id="categoryDoughnutChart"></canvas>
            </div>
            <div class="mt-4 w-full">
                <div class="grid grid-cols-2 gap-2">
                    ${categories.map(([category, count], index) => `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${backgroundColors[index]}"></div>
                            <span class="text-xs text-gray-700 flex-1">${category}</span>
                            <span class="text-xs font-semibold text-up">${count}</span>
                            <span class="text-xs text-gray-500">(${Math.round((count / total) * 100)}%)</span>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 pt-2 border-t border-gray-200 text-center">
                    <span class="text-sm text-gray-600">Total cases: </span>
                    <span class="font-semibold text-up">${total}</span>
                </div>
            </div>
        </div>
    `;
    
    // Create or update the doughnut chart
    const ctx = document.getElementById('categoryDoughnutChart').getContext('2d');
    if (categoryChart) {
        categoryChart.data.labels = labels;
        categoryChart.data.datasets[0].data = data;
        categoryChart.data.datasets[0].backgroundColor = backgroundColors;
        categoryChart.update();
    } else {
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

// Render Cases by Offense Level
function renderCasesByOffense(casesByOffenseLevel) {
    const container = document.getElementById('casesByOffenseContainer');
    const offenses = Object.entries(casesByOffenseLevel);
    const total = offenses.reduce((sum, [_, count]) => sum + count, 0);
    
    if (offenses.length === 0) {
        container.innerHTML = '<div class="text-center py-8"><p class="text-sm text-gray-500">No offense data available</p></div>';
        return;
    }
    
    // Generate colors for the chart
    const colors = [
        '#F59E0B', '#D97706', '#B45309', '#FBBF24',
        '#FCD34D', '#FDE68A', '#92400E', '#A16207'
    ];
    
    const labels = offenses.map(([offense]) => offense);
    const data = offenses.map(([_, count]) => count);
    const backgroundColors = colors.slice(0, offenses.length);
    
    container.innerHTML = `
        <div class="flex flex-col items-center">
            <div class="doughnut-container">
                <canvas id="offenseDoughnutChart"></canvas>
            </div>
            <div class="mt-4 w-full">
                <div class="grid grid-cols-2 gap-2">
                    ${offenses.map(([offense, count], index) => `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${backgroundColors[index]}"></div>
                            <span class="text-xs text-gray-700 flex-1">${offense}</span>
                            <span class="text-xs font-semibold text-up">${count}</span>
                            <span class="text-xs text-gray-500">(${Math.round((count / total) * 100)}%)</span>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 pt-2 border-t border-gray-200 text-center">
                    <span class="text-sm text-gray-600">Total cases: </span>
                    <span class="font-semibold text-up">${total}</span>
                </div>
            </div>
        </div>
    `;
    
    // Create or update the doughnut chart
    const ctx = document.getElementById('offenseDoughnutChart').getContext('2d');
    if (offenseChart) {
        offenseChart.data.labels = labels;
        offenseChart.data.datasets[0].data = data;
        offenseChart.data.datasets[0].backgroundColor = backgroundColors;
        offenseChart.update();
    } else {
        offenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

// NEW: Render location hotspots (horizontal bar chart)
function renderLocationHotspots(locationsData) {
    const container = document.getElementById('locationHotspotContainer');
    if (!locationsData || locationsData.length === 0) {
        container.innerHTML = '<div class="text-center py-8"><p class="text-sm text-gray-500">No location data available</p></div>';
        return;
    }

    // Sort descending and take top 10 for readability
    const sorted = [...locationsData].sort((a, b) => b.count - a.count);
    const topLocations = sorted.slice(0, 10);
    const labels = topLocations.map(item => item.location);
    const counts = topLocations.map(item => item.count);

    // Create or reuse canvas
    let canvas = document.getElementById('locationBarChartCanvas');
    if (!canvas) {
        container.innerHTML = '<canvas id="locationBarChartCanvas" style="width:100%; height:280px;"></canvas>';
        canvas = document.getElementById('locationBarChartCanvas');
    }
    const ctx = canvas.getContext('2d');

    // Destroy previous chart instance if exists
    if (locationChart) locationChart.destroy();

    locationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of reports',
                data: counts,
                backgroundColor: '#6F1A1F',
                borderRadius: 6,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',  // horizontal bar chart – easier to read location names
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} reports`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of reports',
                        color: '#8F7E7E',
                        font: { size: 11 }
                    },
                    grid: { color: '#F0E4E4' },
                    beginAtZero: true
                },
                y: {
                    ticks: {
                        font: { size: 11 },
                        autoSkip: false
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// Update line chart with reports data
function updateLineChart(reportsData) {
    const ctx = document.getElementById('reportsLineChart').getContext('2d');
    const weeks = reportsData.map(item => item.week);
    const counts = reportsData.map(item => item.count);
    
    if (lineChart) {
        lineChart.data.labels = weeks;
        lineChart.data.datasets[0].data = counts;
        lineChart.update();
    } else {
        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [{
                    label: 'Reports',
                    data: counts,
                    borderColor: '#6F1A1F',
                    backgroundColor: 'rgba(111,26,31,0.03)',
                    borderWidth: 2,
                    pointBackgroundColor: '#6F1A1F',
                    pointBorderColor: 'white',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Reports: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#F0E4E4' },
                        title: { display: true, text: 'Number of reports', color: '#8F7E7E', font: { size: 11 } }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } }
                    }
                }
            }
        });
    }
}

// Update bar chart with appointments by mode
function updateBarChart(appointmentsData) {
    const ctx = document.getElementById('appointmentsBarChart').getContext('2d');
    const modes = appointmentsData.map(item => item.mode);
    const counts = appointmentsData.map(item => item.count);
    
    if (barChart) {
        barChart.data.labels = modes;
        barChart.data.datasets[0].data = counts;
        barChart.update();
    } else {
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: modes,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#6F1A1F', '#6F1A1F', '#6F1A1F'],
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // This makes it horizontal
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Appointments: ${context.parsed.x}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        beginAtZero: true, 
                        grid: { color: '#F0E4E4' },
                        title: { display: true, text: 'Number of appointments', color: '#6F1A1F', font: { size: 11 } }
                    },
                    y: { 
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    }
}

// Update monthly reports chart
function updateMonthlyChart(monthlyReports) {
    const ctx = document.getElementById('monthlyReportsChart').getContext('2d');
    const months = monthlyReports.map(item => item.month.substring(0, 3)); // Jan, Feb, etc.
    const counts = monthlyReports.map(item => item.count);
    const year = monthlyReports[0]?.year || 2026;
    
    document.getElementById('currentYearDisplay').innerText = year;
    
    if (monthlyChart) {
        monthlyChart.data.labels = months;
        monthlyChart.data.datasets[0].data = counts;
        monthlyChart.update();
    } else {
        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Reports',
                    data: counts,
                    backgroundColor: '#6F1A1F',
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Reports: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#F0E4E4' },
                        title: { display: true, text: 'Number of reports', color: '#8F7E7E', font: { size: 11 } }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    }
}

// Fetch dashboard data from API
async function fetchDashboardData() {
    const token = getAuthToken();
    if (!token) return;

    // Show loading state
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = `
        <div class="stat-card text-center py-8 col-span-full">
            <div class="loading-spinner mx-auto mb-3"></div>
            <p class="text-xs text-[#8F7E7E]">Loading dashboard data...</p>
        </div>
    `;

    try {
        const response = await fetch('https://safespace-back.onrender.com/api/v1/admin/dashboard', {
        // const response = await fetch('http://localhost:3000/api/v1/admin/dashboard', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                if (typeof toast !== 'undefined') toast.error('Session expired', 'Please login again.');
                localStorage.removeItem('token');
                setTimeout(() => window.location.href = '/login.html', 1500);
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Render stat cards
            renderStats(data);
            
            // Update charts
            updateLineChart(data.reportsLast6Weeks);
            updateBarChart(data.appointmentsByMode);
            
            // Render new sections
            renderCasesByCategory(data.casesByCategory);
            renderCasesByOffense(data.casesByOffenseLevel);
            updateMonthlyChart(data.monthlyReports);
            
            // NEW: Render location hotspots if data is provided
            if (data.casesByLocation && Array.isArray(data.casesByLocation)) {
                renderLocationHotspots(data.casesByLocation);
            } else {
                // Optionally show a message or mock data for testing
                console.warn("No casesByLocation data from API.");
                const locationContainer = document.getElementById('locationHotspotContainer');
                if (locationContainer) {
                    locationContainer.innerHTML = '<div class="text-center py-8"><p class="text-sm text-gray-500">No location data available. Please ensure backend returns casesByLocation.</p></div>';
                }
            }
            
        } else {
            throw new Error('Failed to load dashboard data');
        }
        
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        if (typeof toast !== 'undefined') toast.error('Error', 'Failed to load dashboard data');
        
        // Show error state
        statsContainer.innerHTML = `
            <div class="stat-card text-center py-8 col-span-full">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
                <p class="text-sm text-red-600">Failed to load dashboard data</p>
                <button onclick="fetchDashboardData()" class="mt-3 text-xs bg-up text-white px-3 py-1 rounded-full">Retry</button>
            </div>
        `;
    }
}

// Event Listeners
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

// Initialize
if (checkAuth()) {
    updateSidebarInfo();
    fetchDashboardData();
}