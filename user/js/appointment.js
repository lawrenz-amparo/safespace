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
    toast.success('Logged out', 'You have been successfully logged out.');
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 1500);
}

// Check authentication
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        toast.warning('Authentication required', 'Please log in to view your appointments.');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return false;
    }
    return true;
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return { date: 'N/A', time: '' };
    try {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    } catch (e) {
        return { date: dateTimeString, time: '' };
    }
}

// UPDATED: Map consultation mode to user‑friendly display (supports new & legacy values)
function getModeDisplay(mode) {
    const modes = {
        // New modes
        'in-person-oash': 'In Person (OASH)',
        'in-person-counseling': 'In Person (Counseling)',
        'video-call-oash': 'Video Call OASH',
        'video-call-counseling': 'Video Call Counseling',
        // Legacy modes (backward compatibility)
        'in-person': 'In-person',
        'video-call': 'Video call',
        'phone-call': 'Phone call'
    };
    return modes[mode] || mode;
}

function getStatusClass(status) {
    const statusMap = {
        'confirmed': 'status-confirmed',
        'pending': 'status-pending',
        'cancelled': 'status-cancelled',
        'completed': 'status-completed'
    };
    return statusMap[status?.toLowerCase()] || 'status-pending';
}

function getStatusText(status) {
    const statusMap = {
        'confirmed': 'Confirmed',
        'pending': 'Pending',
        'cancelled': 'Cancelled',
        'completed': 'Completed'
    };
    return statusMap[status?.toLowerCase()] || status;
}

let appointmentsData = [];
let currentPage = 1;
let totalPages = 1;
let totalItems = 0;
const rowsPerPage = 5;

// Fetch appointments from API
async function fetchAppointments(page = 1) {
    const token = getAuthToken();
    if (!token) return;

    const loadingState = document.getElementById('loadingState');
    const desktopView = document.getElementById('desktopView');
    const noAppointmentsState = document.getElementById('noAppointmentsState');

    loadingState.classList.remove('hidden');
    desktopView.classList.add('hidden');
    noAppointmentsState.classList.add('hidden');

    try {
        const response = await fetch(`https://safespace-back.onrender.com/api/v1/user/appointments?page=${page}&limit=${rowsPerPage}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            appointmentsData = data.data || [];
            totalItems = data.pagination?.total || 0;
            totalPages = data.pagination?.totalPages || 1;
            currentPage = data.pagination?.page || page;

            const activeCount = appointmentsData.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
            document.getElementById('desktop-count').innerText = activeCount + ' active';

            if (appointmentsData.length === 0) {
                desktopView.classList.add('hidden');
                noAppointmentsState.classList.remove('hidden');
            } else {
                desktopView.classList.remove('hidden');
                noAppointmentsState.classList.add('hidden');
                renderDesktop();
            }
        } else {
            toast.error('Error', data.message || 'Failed to fetch appointments');
        }
    } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Connection error', 'Unable to connect to server.');
    } finally {
        loadingState.classList.add('hidden');
    }
}

function renderDesktop() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalItems);
    
    const tbody = document.getElementById('desktop-table-body');
    tbody.innerHTML = appointmentsData.map(a => {
        const { date, time } = formatDateTime(a.preferredDate);
        return `
            <tr class="border-b border-[#F0E4E4] hover:bg-[#FDF8F8]">
                <td class="p-3">
                    <span class="font-medium">${date}</span><br>
                    <span class="text-xs text-[#8F7E7E]">${time}</span>
                </td>
                <td class="p-3">${getModeDisplay(a.consultationMode)}</td>
                <td class="p-3">${a.purpose || 'N/A'}</td>
                <td class="p-3"><span class="status-badge ${getStatusClass(a.status)}">${getStatusText(a.status)}</span></td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('desktop-pagination-info').innerHTML = `Showing ${start + 1}–${end} of ${totalItems}`;
    renderPaginationButtons(currentPage);
}

function renderPaginationButtons(currentPage) {
    const container = document.getElementById('desktop-pagination-buttons');
    if (!container) return;
    
    let buttons = '';
    
    buttons += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
        <i class="fas fa-chevron-left text-xs"></i>
    </button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            buttons += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            buttons += `<span class="px-2 text-[#8F7E7E]">...</span>`;
        }
    }

    buttons += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
        <i class="fas fa-chevron-right text-xs"></i>
    </button>`;

    container.innerHTML = buttons;
}

window.changePage = function(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    fetchAppointments(newPage);
};

// Create appointment
async function createAppointment(formData) {
    const token = getAuthToken();
    if (!token) {
        toast.error('Not authenticated', 'Please log in to create an appointment.');
        return false;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch('https://safespace-back.onrender.com/api/v1/user/appointment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            toast.success('Appointment request sent!', 'Your appointment has been submitted. You will receive a confirmation soon.');
            closeModal();
            fetchAppointments(currentPage);
            return true;
        } else {
            let errorMsg = data.message || 'Failed to create appointment';
            if (response.status === 409) {
                errorMsg = data.message || 'This time slot is already booked. Please choose a different time.';
            } else if (response.status === 400) {
                errorMsg = data.message || 'Please check your input and try again.';
            } else if (response.status === 401) {
                errorMsg = 'Your session has expired. Please log in again.';
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            }
            toast.error('Request failed', errorMsg);
            return false;
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
        toast.error('Connection error', 'Unable to connect to server. Please check your connection.');
        return false;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

// Modal functionality
const modal = document.getElementById('appointmentModal');
const openBtn = document.getElementById('openModalBtn');
const closeBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelModalBtn');
const noAppointmentsBtn = document.getElementById('noAppointmentsBtn');

function openModal() {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('appointmentForm').reset();
}

if (openBtn) openBtn.addEventListener('click', openModal);
if (noAppointmentsBtn) noAppointmentsBtn.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

// Flatpickr
if (document.getElementById('datePicker')) {
    flatpickr('#datePicker', {
        minDate: 'today',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'F j, Y',
        disableMobile: true,
        theme: 'material_red'
    });
}

if (document.getElementById('timePicker')) {
    flatpickr('#timePicker', {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:00",
        altInput: true,
        altFormat: "h:00 K",
        minuteIncrement: 60,
        disableMobile: true,
        theme: 'material_red',
        time_24hr: true,
        minTime: '08:00',
        maxTime: '17:00',
        enable: [
            "08:00", "09:00", "10:00", "11:00", "12:00", 
            "13:00", "14:00", "15:00", "16:00"
        ],
        onReady: function(selectedDates, dateStr, instance) {
            instance.set('minuteIncrement', 60);
        }
    });
}

// Form submit
const form = document.getElementById('appointmentForm');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        // Order: purpose first, then consultationMode (as in HTML)
        const purpose = document.getElementById('purpose').value;
        const consultationMode = document.getElementById('consultationMode').value;
        const preferredDate = document.getElementById('datePicker').value;
        let preferredTime = document.getElementById('timePicker').value;
        const additionalNotes = document.getElementById('additionalNotes').value;
        const confirmAccuracy = document.getElementById('confirmAccuracy').checked;
        
        if (!fullName || !phoneNumber || !purpose || !consultationMode || !preferredDate || !preferredTime) {
            toast.warning('Missing fields', 'Please fill in all required fields.');
            return;
        }
        
        if (!confirmAccuracy) {
            toast.warning('Confirmation required', 'Please confirm that the information is accurate.');
            return;
        }
        
        // Convert time to HH:00 format if it's in AM/PM format
        if (preferredTime.includes('AM') || preferredTime.includes('PM')) {
            const timeMatch = preferredTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2];
                const period = timeMatch[3].toUpperCase();
                
                if (period === 'PM' && hours !== 12) {
                    hours += 12;
                }
                if (period === 'AM' && hours === 12) {
                    hours = 0;
                }
                preferredTime = `${hours.toString().padStart(2, '0')}:00`;
            }
        }
        
        if (!/^([0-1]?[0-9]|2[0-3]):00$/.test(preferredTime)) {
            toast.error('Invalid time', 'Please select an hourly time slot (e.g., 09:00, 14:00)');
            return;
        }
        
        const formData = {
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            consultationMode: consultationMode,
            purpose: purpose.trim(),
            preferredDate: preferredDate,
            preferredTime: preferredTime,
            additionalNotes: additionalNotes.trim() || null
        };
        
        await createAppointment(formData);
    });
}

// Initialize page
if (checkAuth()) {
    fetchAppointments(1);
}

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

document.getElementById('mobileLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});