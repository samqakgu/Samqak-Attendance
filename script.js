// Application State
let attendanceRecords = [];
let showingAllHistory = false;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initializeApp();
});

function initializeApp() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;

    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        showDashboard();
    } else {
        showLogin();
    }

    // Event Listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('submit', handleLogout);
    document.getElementById('attendanceForm').addEventListener('submit', handleAttendanceSubmit);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('toggleHistoryBtn').addEventListener('click', toggleHistory);

    // Handle logo image error
    document.querySelectorAll('img[src="logo.png"]').forEach(img => {
        img.onerror = function() {
            // Create a simple colored circle with text as fallback
            const fallback = document.createElement('div');
            fallback.style.cssText = 'width:100%;height:100%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:24px;';
            fallback.textContent = 'S';
            this.parentNode.replaceChild(fallback, this);
        };
    });
}

function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    renderAttendanceTable();
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    // Simple authentication (demo credentials)
    if (username === 'teacher' && password === '1234') {
        localStorage.setItem('isLoggedIn', 'true');
        errorDiv.classList.add('hidden');
        showDashboard();
    } else {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.classList.remove('hidden');
    }
}

function handleLogout(e) {
    if (e) e.preventDefault();
    localStorage.setItem('isLoggedIn', 'false');
    showLogin();
    document.getElementById('loginForm').reset();
}

function handleAttendanceSubmit(e) {
    e.preventDefault();

    const record = {
        id: Date.now(),
        name: document.getElementById('studentName').value.trim(),
        class: document.getElementById('studentClass').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        date: document.getElementById('attendanceDate').value,
        status: document.querySelector('input[name="status"]:checked').value,
        timestamp: new Date().toISOString()
    };

    attendanceRecords.unshift(record);
    saveToLocalStorage();
    renderAttendanceTable();

    // Reset form
    document.getElementById('attendanceForm').reset();
    document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('statusPresent').checked = true;
    document.getElementById('genderMale').checked = true;

    // Show success feedback
    showSuccessMessage();
}

function showSuccessMessage() {
    const form = document.getElementById('attendanceForm');
    const message = document.createElement('div');
    message.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center font-medium';
    message.textContent = '✓ Attendance recorded successfully!';
    
    form.insertAdjacentElement('afterend', message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTable');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    // Filter records
    let filteredRecords = attendanceRecords.filter(record => {
        const matchesSearch = record.name.toLowerCase().includes(searchTerm) || 
                            record.class.toLowerCase().includes(searchTerm);
        const matchesDate = showingAllHistory || record.date === today;
        return matchesSearch && matchesDate;
    });

    // Clear table
    tbody.innerHTML = '';

    if (filteredRecords.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                ${showingAllHistory ? 'No attendance records found' : 'No attendance records for today'}
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }

    // Render records
    filteredRecords.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';
        
        const statusClass = record.status === 'Present' ? 'status-present' : 'status-absent';
        const formattedDate = formatDate(record.date);
        
        row.innerHTML = `
            <td class="px-4 py-3 text-gray-800">${escapeHtml(record.name)}</td>
            <td class="px-4 py-3 text-gray-600">${escapeHtml(record.class)}</td>
            <td class="px-4 py-3 text-gray-600">${escapeHtml(record.gender)}</td>
            <td class="px-4 py-3 text-gray-600">${formattedDate}</td>
            <td class="px-4 py-3 ${statusClass}">${escapeHtml(record.status)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function toggleHistory() {
    const btn = document.getElementById('toggleHistoryBtn');
    showingAllHistory = !showingAllHistory;
    
    if (showingAllHistory) {
        btn.textContent = 'View Today Only';
        btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        btn.classList.add('bg-gray-500', 'hover:bg-gray-600');
    } else {
        btn.textContent = 'View All History';
        btn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }
    
    renderAttendanceTable();
}

function handleSearch() {
    renderAttendanceTable();
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveToLocalStorage() {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('attendanceRecords');
    if (stored) {
        try {
            attendanceRecords = JSON.parse(stored);
        } catch (e) {
            attendanceRecords = [];
        }
    }
}

// Fix logout button event listener
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.setItem('isLoggedIn', 'false');
            showLogin();
            document.getElementById('loginForm').reset();
        });
    }
});