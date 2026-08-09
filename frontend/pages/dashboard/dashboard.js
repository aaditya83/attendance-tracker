import { authFetch, getUser } from "../../js/auth.js";

const refreshBtn = document.getElementById("refreshBtn");
const overallPercentageEl = document.getElementById("overallPercentage");
const totalPresentEl = document.getElementById("totalPresent");
const totalAbsentEl = document.getElementById("totalAbsent");
const totalSubjectsEl = document.getElementById("totalSubjects");
const dashboardSubjectsGrid = document.getElementById("dashboardSubjectsGrid");

// Sidebar user elements
const sidebarUser = document.getElementById("sidebarUser");
const sidebarUsername = document.getElementById("sidebarUsername");
const sidebarEmail = document.getElementById("sidebarEmail");

function displayUserInfo() {
    const user = getUser();
    if (user) {
        sidebarUsername.textContent = user.username || "User";
        sidebarEmail.textContent = user.email || "";
        sidebarUser.style.display = "block";
    }
}

displayUserInfo();

function getBadgeClass(percentage, required = 75) {
    if (percentage >= required) return "good";
    if (percentage >= required - 10) return "warning";
    return "danger";
}

function getProgressClass(percentage, required = 75) {
    if (percentage >= required) return "good";
    if (percentage >= required - 10) return "warning";
    return "danger";
}

function renderDashboardCards(data) {
    const subjects = Array.isArray(data.subjects) ? data.subjects : [];
    const totalPresent = subjects.reduce((sum, item) => sum + (item.present || 0), 0);
    const totalAbsent = subjects.reduce((sum, item) => sum + (item.absent || 0), 0);

    overallPercentageEl.textContent = `${(data.overall_attendance || 0).toFixed(1)}%`;
    totalPresentEl.textContent = totalPresent;
    totalAbsentEl.textContent = totalAbsent;
    totalSubjectsEl.textContent = subjects.length;

    if (subjects.length === 0) {
        dashboardSubjectsGrid.innerHTML = '<div class="empty-state">No subjects yet. Add one to start tracking attendance.</div>';
        return;
    }

    dashboardSubjectsGrid.innerHTML = subjects.map((subject) => {
        const percentage = subject.attendance_percentage || 0;
        const required = subject.required_attendance || 75;
        const badgeClass = getBadgeClass(percentage, required);
        const progressClass = getProgressClass(percentage, required);

        return `
            <article class="subject-card">
                <div class="subject-header">
                    <h3 class="subject-name">${subject.subject_name}</h3>
                    <span class="subject-badge ${badgeClass}">${percentage.toFixed(1)}%</span>
                </div>
                <div class="subject-stats">
                    <div class="stat-item">
                        <div class="value">${subject.present || 0}</div>
                        <div class="label">Present</div>
                    </div>
                    <div class="stat-item">
                        <div class="value">${subject.absent || 0}</div>
                        <div class="label">Absent</div>
                    </div>
                    <div class="stat-item">
                        <div class="value">${subject.total_classes || 0}</div>
                        <div class="label">Total</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="subject-actions">
                    <div class="action-item">
                        <div class="value">${subject.classes_needed || 0}</div>
                        <div class="label">Needed</div>
                    </div>
                    <div class="action-item">
                        <div class="value">${subject.safe_bunks || 0}</div>
                        <div class="label">Safe Bunks</div>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function loadDashboardData() {
    try {

        const response = await authFetch("/dashboard/");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        renderDashboardCards(data);

    } catch (error) {

        console.error("Failed to load dashboard:", error);

        overallPercentageEl.textContent = "--%";
        totalPresentEl.textContent = "--";
        totalAbsentEl.textContent = "--";
        totalSubjectsEl.textContent = "--";

        dashboardSubjectsGrid.innerHTML =
            '<div class="empty-state">Unable to load dashboard data.</div>';
    }
}

refreshBtn?.addEventListener("click", loadDashboardData);
loadDashboardData();
