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

// Helper functions
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

function formatDateDisplay(isoDate) {   
    if (!isoDate) return 'Not set';
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTimeModal(isoDate, timeStr) {
    const datePart = formatDateDisplay(isoDate);
    const time = timeStr || '--:--';
    return `${datePart} at ${time}`;
}

function formatMode(mode) {
    const modes = {
        'in-person': 'In-person',
        'in-person-oash': 'In Person (OASH)',
        'in-person-counseling': 'In Person (Counseling)',
        'video-call-oash': 'Video Call OASH',
        'video-call-counseling': 'Video Call Counseling',
        'video': 'Video call',
        'phone': 'Phone call',
        'phone-call': 'Phone call'
    };
    return modes[mode] || mode || '—';
}

// Global state
let allAppointmentsData = [];
let currentPage = 1;
let totalPages = 1;
let totalItems = 0;
const rowsPerPage = 5;
let currentFilters = {
    search: '',
    status: 'all',
    fromDate: '',
    toDate: ''
};
let debounceTimer = null;

// API calls with pagination and filters
async function fetchAppointments(page = 1) {
    const token = getAuthToken();
    if (!token) {
        if (typeof toast !== 'undefined') toast.error('No token', 'Please login again.');
        return;
    }
    
    // Show loading state
    const tbody = document.getElementById('desktop-table-body');
    const mobileContainer = document.getElementById('mobile-cards-container');
    if (tbody) tbody.innerHTML = '<td colspan="6" class="text-center py-8"><div class="loading-spinner mx-auto"></div> Loading...</td>';
    if (mobileContainer) mobileContainer.innerHTML = '<div class="text-center py-8"><div class="loading-spinner mx-auto"></div> Loading...</div>';
    
    try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', rowsPerPage);
        
        // Add filters
        if (currentFilters.search && currentFilters.search.trim()) {
            params.append('search', currentFilters.search.trim());
        }
        if (currentFilters.status && currentFilters.status !== 'all') {
            params.append('status', currentFilters.status);
        }
        if (currentFilters.fromDate) {
            params.append('fromDate', currentFilters.fromDate);
        }
        if (currentFilters.toDate) {
            params.append('toDate', currentFilters.toDate);
        }
        
        const url = `https://safespace-back.onrender.com/api/v1/admin/appointments?${params.toString()}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
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
        if (result.success && Array.isArray(result.data)) {
            allAppointmentsData = result.data.map(item => ({
                id: item.id || item.appointmentId,
                appointmentId: item.appointmentId,
                fullName: item.fullName || 'Unknown',
                phoneNumber: item.phoneNumber || 'N/A',
                consultationMode: item.consultationMode || 'in-person',
                purpose: item.purpose || 'N/A',
                preferredDate: item.preferredDate,
                preferredTime: item.preferredTime,
                status: item.status || 'pending',
                additionalNotes: item.additionalNotes || 'None',
                createdAt: item.createdAt,
                userId: item.userId
            }));
            
            // Update pagination info from backend
            currentPage = result.pagination.page;
            totalPages = result.pagination.totalPages;
            totalItems = result.pagination.total;
            
            renderDesktop();
            renderMobile();
        } else {
            allAppointmentsData = [];
            renderDesktop();
            renderMobile();
        }
    } catch (err) {
        console.error(err);
        if (typeof toast !== 'undefined') toast.error('Error', 'Failed to load appointments.');
        const tbody = document.getElementById('desktop-table-body');
        if (tbody) tbody.innerHTML = '<td colspan="6" class="text-center py-8 text-red-600">Error loading data</td>';
    }
}

async function updateAppointmentStatus(appointmentId, newStatus) {
    const token = getAuthToken();
    if (!token) {
        if (typeof toast !== 'undefined') toast.error('Auth required', 'Please login.');
        return false;
    }
    try {
        const response = await fetch(`https://safespace-back.onrender.com/api/v1/admin/appointment/${appointmentId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            if (typeof toast !== 'undefined') toast.success('Status updated', `Changed to ${newStatus === 'rejected' ? 'Rescheduled' : newStatus}`);
            // Refresh the current page to get updated data
            fetchAppointments(currentPage);
            return true;
        } else {
            if (typeof toast !== 'undefined') toast.error('Update failed', result.message || 'Could not update');
            return false;
        }
    } catch (err) {
        if (typeof toast !== 'undefined') toast.error('Network error', 'Please check connection');
        return false;
    }
}

// Apply filters with debounce
function applyFilters() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentFilters = {
            search: document.getElementById('searchInput')?.value || '',
            status: document.getElementById('statusFilter')?.value || 'all',
            fromDate: document.getElementById('fromDate')?.value || '',
            toDate: document.getElementById('toDate')?.value || ''
        };
        currentPage = 1;
        fetchAppointments(1);
    }, 500);
}

// Clear all filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('fromDate').value = '';
    document.getElementById('toDate').value = '';
    
    currentFilters = {
        search: '',
        status: 'all',
        fromDate: '',
        toDate: ''
    };
    currentPage = 1;
    fetchAppointments(1);
}

// Render functions
function renderDesktop() {
    const tbody = document.getElementById('desktop-table-body');
    if (!tbody) return;
    
    if (allAppointmentsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-[#8F7E7E]">No appointments found</td></tr>`;
    } else {
        tbody.innerHTML = allAppointmentsData.map(app => {
            const dateTimeDisplay = `${formatDateDisplay(app.preferredDate)} · ${app.preferredTime || '--:--'}`;
            return `
                <tr>
                    <td><div class="font-medium">${escapeHtml(app.fullName)}</div><div class="text-xs text-[#8F7E7E]">ID: ${escapeHtml(app.userId?.slice(0,8) || '—')}</div></td>
                    <td>${dateTimeDisplay}</td>
                    <td>${formatMode(app.consultationMode)}</td>
                    <td>${escapeHtml(app.purpose)}</td>
                    <td>
                        <select class="status-select ${app.status}" data-appointment-id="${app.appointmentId}" onchange="handleStatusChange('${app.appointmentId}', this.value)">
                            <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${app.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Reschedule</option>
                            <option value="completed" ${app.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td><button class="action-btn" onclick="openViewModal('${app.appointmentId}')"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `;
        }).join('');
    }
    
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(start + rowsPerPage - 1, totalItems);
    document.getElementById('desktop-pagination-info').innerHTML = totalItems > 0 ? `Showing ${start}–${end} of ${totalItems}` : 'No results';
    renderPagination('desktop');
}

function renderMobile() {
    const container = document.getElementById('mobile-cards-container');
    if (!container) return;
    
    if (allAppointmentsData.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-[#8F7E7E]">No appointments found</div>`;
    } else {
        container.innerHTML = allAppointmentsData.map(app => {
            const dateTimeDisplay = `${formatDateDisplay(app.preferredDate)} · ${app.preferredTime || '--:--'}`;
            return `
                <div class="appointment-card">
                    <div class="appointment-card-row"><span class="appointment-card-label">Student</span><span class="appointment-card-value">${escapeHtml(app.fullName)}</span></div>
                    <div class="appointment-card-row"><span class="appointment-card-label">Date & time</span><span class="appointment-card-value">${dateTimeDisplay}</span></div>
                    <div class="appointment-card-row"><span class="appointment-card-label">Mode</span><span class="appointment-card-value">${formatMode(app.consultationMode)}</span></div>
                    <div class="appointment-card-row"><span class="appointment-card-label">Purpose</span><span class="appointment-card-value">${escapeHtml(app.purpose)}</span></div>
                    <div class="appointment-card-row"><span class="appointment-card-label">Status</span><span class="appointment-card-value">
                        <select class="status-select ${app.status}" onchange="handleStatusChange('${app.appointmentId}', this.value)">
                            <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${app.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Reschedule</option>
                            <option value="completed" ${app.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </span></div>
                    <div class="flex justify-end mt-3"><button class="action-btn" onclick="openViewModal('${app.appointmentId}')"><i class="fas fa-eye mr-1"></i>View details</button></div>
                </div>
            `;
        }).join('');
    }
    
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(start + rowsPerPage - 1, totalItems);
    document.getElementById('mobile-pagination-info').innerHTML = totalItems > 0 ? `Showing ${start}–${end} of ${totalItems}` : 'No results';
    renderPagination('mobile');
}

function renderPagination(view) {
    const container = document.getElementById(`${view}-pagination-buttons`);
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let buttons = '';
    buttons += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            buttons += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            buttons += `<span class="px-2 text-[#8F7E7E]">...</span>`;
        }
    }
    
    buttons += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = buttons;
}

function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    fetchAppointments(newPage);
}

window.handleStatusChange = async function(appointmentId, newStatus) {
    const selects = document.querySelectorAll(`select[data-appointment-id="${appointmentId}"]`);
    selects.forEach(sel => sel.disabled = true);
    await updateAppointmentStatus(appointmentId, newStatus);
    selects.forEach(sel => sel.disabled = false);
};

// Modal view for details
window.openViewModal = function(appointmentId) {
    const app = allAppointmentsData.find(a => a.appointmentId === appointmentId);
    if (!app) {
        if (typeof toast !== 'undefined') toast.error('Not found', 'Appointment details missing');
        return;
    }
    const modal = document.getElementById('viewModal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-row"><div class="detail-label">Full Name</div><div class="detail-value">${escapeHtml(app.fullName)}</div></div>
        <div class="detail-row"><div class="detail-label">Phone Number</div><div class="detail-value">${escapeHtml(app.phoneNumber)}</div></div>
        <div class="detail-row"><div class="detail-label">Date & Time</div><div class="detail-value">${formatDateTimeModal(app.preferredDate, app.preferredTime)}</div></div>
        <div class="detail-row"><div class="detail-label">Mode</div><div class="detail-value">${formatMode(app.consultationMode)}</div></div>
        <div class="detail-row"><div class="detail-label">Purpose</div><div class="detail-value">${escapeHtml(app.purpose)}</div></div>
        <div class="detail-row"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge-modal ${app.status}">${app.status === 'rejected' ? 'RESCHEDULE' : app.status.toUpperCase()}</span></div></div>
        <div class="detail-row"><div class="detail-label">Additional Notes</div><div class="detail-value">${escapeHtml(app.additionalNotes || 'None')}</div></div>
        <div class="detail-row"><div class="detail-label">Appointment ID</div><div class="detail-value text-xs">${app.appointmentId}</div></div>
        <div class="detail-row"><div class="detail-label">Created</div><div class="detail-value">${new Date(app.createdAt).toLocaleString()}</div></div>
    `;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

function closeModal() {
    const modal = document.getElementById('viewModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Event listeners
document.getElementById('searchInput')?.addEventListener('input', () => applyFilters());
document.getElementById('statusFilter')?.addEventListener('change', () => applyFilters());
document.getElementById('fromDate')?.addEventListener('change', () => applyFilters());
document.getElementById('toDate')?.addEventListener('change', () => applyFilters());
document.getElementById('clearFiltersBtn')?.addEventListener('click', () => clearFilters());
document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
document.getElementById('viewModal')?.addEventListener('click', (e) => { if(e.target === document.getElementById('viewModal')) closeModal(); });

// Initialize
if (checkAuth()) {
    fetchAppointments(1);
}