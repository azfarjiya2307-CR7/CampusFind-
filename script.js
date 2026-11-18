// CAMPUSFIND - FINAL JAVASCRIPT

// DATA FUNCTIONS

function getUsers() {
    return JSON.parse(localStorage.getItem("campusUsers") || "[]");
}

function getReports() {
    return JSON.parse(localStorage.getItem("campusReports") || "[]");
}

function saveReports(reports) {
    localStorage.setItem("campusReports", JSON.stringify(reports));
}

function getCurrentUser() {
    return sessionStorage.getItem("campusUser");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// LOGIN AND SIGNUP

function showSignup() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
}

function showLogin() {
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
}

function initializeApp() {

    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

    if (signupForm) {
        signupForm.onsubmit = function(event) {
            event.preventDefault();

            const name = document.getElementById("signupName").value.trim();
            const email = document.getElementById("signupEmail").value.trim().toLowerCase();
            const password = document.getElementById("signupPassword").value;

            const users = getUsers();

            if (users.some(user => user.email === email)) {
                alert("Account already exists!");
                return;
            }

            users.push({ name, email, password });

            localStorage.setItem("campusUsers", JSON.stringify(users));

            alert("Signup successful!");
            signupForm.reset();
            showLogin();
        };
    }

    if (loginForm) {
        loginForm.onsubmit = function(event) {
            event.preventDefault();

            const email = document.getElementById("loginEmail").value.trim().toLowerCase();
            const password = document.getElementById("loginPassword").value;

            const user = getUsers().find(
                user => user.email === email && user.password === password
            );

            if (!user) {
                alert("Invalid email or password!");
                return;
            }

            sessionStorage.setItem("campusUser", email);
            sessionStorage.setItem("campusLoggedIn", "yes");

            openDashboard();
        };
    }

    if (getCurrentUser()) {
        openDashboard();
    }
}

// DASHBOARD

function openDashboard() {
    const auth = document.getElementById("authArea");
    const app = document.getElementById("appContent");

    if (auth) auth.style.display = "none";
    if (app) app.style.display = "block";

    refreshApp();
}

function logout() {
    sessionStorage.removeItem("campusUser");
    sessionStorage.removeItem("campusLoggedIn");
    location.reload();
}

// PROFILE

function showProfile() {
    const user = getUsers().find(u => u.email === getCurrentUser());

    if (!user) return;

    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;

    const reports = getReports().filter(r => r.user === getCurrentUser());

    document.getElementById("myTotal").textContent = reports.length;
    document.getElementById("myLost").textContent =
        reports.filter(r => r.type === "Lost").length;
    document.getElementById("myFound").textContent =
        reports.filter(r => r.type === "Found").length;
}

// REPORT FORM

function showReportForm(type) {
    const area = document.getElementById("formArea");

    area.innerHTML = `
        <h2>${type} Item</h2>

        <form id="reportForm">
            <input id="itemName" placeholder="Item Name" required>

            <select id="itemCategory" required>
                <option value="">Select Category</option>
                <option> ID Cards </option>
                <option>Electronics</option>
                <option>Books</option>
                <option>Bags</option>
                <option>Keys</option>
                <option>Others</option>
            </select>

            <textarea id="itemDescription"
                placeholder="Description" required></textarea>

            <input id="itemLocation"
                placeholder="Location" required>

            <input id="itemDate" type="date" required>

            <input id="itemImage" type="file" accept="image/*">

            <button type="submit">Submit Report</button>
            <button type="button" onclick="closeReportForm()">Cancel</button>
        </form>
    `;

    document.getElementById("reportForm").onsubmit = function(event) {
        event.preventDefault();

        const file = document.getElementById("itemImage").files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function() {
                saveNewReport(type, reader.result);
            };

            reader.readAsDataURL(file);
        } else {
            saveNewReport(type, "");
        }
    };
}

function closeReportForm() {
    document.getElementById("formArea").innerHTML = "";
}

function saveNewReport(type, image) {
    const report = {
        id: Date.now(),
        type,
        item: document.getElementById("itemName").value,
        category: document.getElementById("itemCategory").value,
        description: document.getElementById("itemDescription").value,
        location: document.getElementById("itemLocation").value,
        date: document.getElementById("itemDate").value,
        image,
        user: getCurrentUser(),
        status: "Active"
    };

    const reports = getReports();
    reports.unshift(report);
    saveReports(reports);

    addNotification("Your report has been submitted successfully!");

    alert("Your report has been submitted successfully!");

    closeReportForm();
    refreshApp();
}

// REPORT CARD

function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";

    const status = report.status || "Active";

    card.innerHTML = `
        <h2>${escapeHTML(report.type)} Item</h2>
        <p><b>Item:</b> ${escapeHTML(report.item)}</p>
        <p><b>Category:</b> ${escapeHTML(report.category)}</p>
        <p><b>Description:</b> ${escapeHTML(report.description)}</p>
        <p><b>Location:</b> ${escapeHTML(report.location)}</p>
        <p><b>Date:</b> ${escapeHTML(report.date)}</p>
        <p><b>Status:</b> ${escapeHTML(status)}</p>

        ${report.image ? `<img src="${report.image}" style="max-width:100%;border-radius:10px;">` : ""}

        <p><b>Reported by:</b> ${escapeHTML(report.user)}</p>

        ${report.user === getCurrentUser() ? `
            <button onclick="editReport(${report.id})">✏️ Edit</button>

            ${status === "Active" ? `
                <button onclick="updateReportStatus(${report.id})">
                    ${report.type === "Lost" ? "Mark as Found" : "Mark as Returned"}
                </button>
            ` : ""}
        ` : ""}
    `;

    return card;
}

// SHOW REPORTS

function showReports() {
    const list = document.getElementById("reportList");
    if (!list) return;

    list.innerHTML = "";

    getReports().forEach(report => {
        list.appendChild(createReportCard(report));
    });

    const count = document.getElementById("reportCount");
    if (count) count.textContent = "Total Reports: " + getReports().length;
}

// EDIT REPORT

function editReport(id) {
    const reports = getReports();
    const report = reports.find(r => r.id === id);

    if (!report || report.user !== getCurrentUser()) return;

    const item = prompt("Edit Item Name:", report.item);
    if (item === null) return;

    const category = prompt("Edit Category:", report.category);
    if (category === null) return;

    const description = prompt("Edit Description:", report.description);
    if (description === null) return;

    const location = prompt("Edit Location:", report.location);
    if (location === null) return;

    report.item = item;
    report.category = category;
    report.description = description;
    report.location = location;

    saveReports(reports);

    addNotification("Your report has been updated!");
    refreshApp();

    alert("Report updated successfully!");
}

// UPDATE STATUS

function updateReportStatus(id) {
    const reports = getReports();
    const report = reports.find(r => r.id === id);

    if (!report || report.user !== getCurrentUser()) return;

    if (report.status && report.status !== "Active") return;

    report.status = report.type === "Lost" ? "Found" : "Returned";

    saveReports(reports);

    addNotification("Report status updated!");
    refreshApp();

    alert("Report status updated successfully!");
}

// MY REPORTS

function showMyReports() {
    const list = document.getElementById("myReportList");
    if (!list) return;

    list.innerHTML = "";

    const reports = getReports().filter(
        r => r.user === getCurrentUser()
    );

    if (reports.length === 0) {
        list.innerHTML = "<p>No reports submitted yet.</p>";
        return;
    }

    reports.forEach(report => {
        list.appendChild(createReportCard(report));
    });
}

// SEARCH AND FILTER

let currentFilter = "All";

function filterReports(type) {
    currentFilter = type;
    searchReports();
}

function searchReports() {
    const input = document.getElementById("searchInput");
    const list = document.getElementById("reportList");

    if (!input || !list) return;

    const search = input.value.toLowerCase();

    const reports = getReports().filter(report => {
        const matchesType =
            currentFilter === "All" || report.type === currentFilter;

        const matchesSearch =
            (report.item || "").toLowerCase().includes(search) ||
            (report.location || "").toLowerCase().includes(search) ||
            (report.category || "").toLowerCase().includes(search);

        return matchesType && matchesSearch;
    });

    list.innerHTML = "";

    reports.forEach(report => {
        list.appendChild(createReportCard(report));
    });

    const count = document.getElementById("reportCount");
    if (count) count.textContent = "Total Reports: " + reports.length;
}

// DASHBOARD COUNTS

function updateDashboard() {
    const reports = getReports();

    document.getElementById("totalCount").textContent = reports.length;

    document.getElementById("lostCount").textContent =
        reports.filter(r => r.type === "Lost").length;

    document.getElementById("foundCount").textContent =
        reports.filter(r => r.type === "Found").length;
}

// NOTIFICATIONS

function getNotifications() {
    return JSON.parse(localStorage.getItem("campusNotifications") || "[]");
}

function addNotification(message) {
    const notifications = getNotifications();

    notifications.unshift({
        message,
        date: new Date().toLocaleString()
    });

    localStorage.setItem(
        "campusNotifications",
        JSON.stringify(notifications)
    );
}

function showNotifications() {
    const list = document.getElementById("notificationList");
    if (!list) return;

    const notifications = getNotifications();
    list.innerHTML = "";

    if (notifications.length === 0) {
        list.innerHTML = "<p>No notifications yet.</p>";
        return;
    }

    notifications.forEach(n => {
        const div = document.createElement("p");
        div.textContent = n.message + " - " + n.date;
        list.appendChild(div);
    });
}

function clearNotifications() {
    localStorage.removeItem("campusNotifications");
    showNotifications();
}

// REFRESH APP

function refreshApp() {
    showReports();
    showMyReports();
    updateDashboard();
    showProfile();
    showNotifications();
}

// STARTUP - SAFE WITH DEFER OR NORMAL SCRIPT LOADING

function startCampusFind() {
    initializeApp();

    const search = document.getElementById("searchInput");

    if (search) {
        search.addEventListener("input", searchReports);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCampusFind);
} else {
    startCampusFind();
}