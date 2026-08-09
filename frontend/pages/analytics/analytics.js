import { authFetch } from "../../js/auth.js";

const analyticsSubjectSelect =
    document.getElementById("analyticsSubject");

const analyticsResult =
    document.getElementById("analyticsResult");


async function loadSubjects() {

    try {

        const response =
            await authFetch("/subjects/");

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                `HTTP error! status: ${response.status}`
            );
        }

        analyticsSubjectSelect.innerHTML =
            `<option value="">All Subjects</option>` +
            data.map(subject =>
                `<option value="${subject.id}">
                    ${subject.name}
                </option>`
            ).join("");

    } catch (error) {

        console.error(
            "Failed to load subjects:",
            error
        );
    }
}


function createCard(subject) {

    const percentage =
        subject.attendance_percentage || 0;

    const required =
        subject.required_attendance || 75;

    let statusClass = "danger";

    if (percentage >= required) {
        statusClass = "good";
    } else if (percentage >= required - 10) {
        statusClass = "warning";
    }

    return `
        <div class="analytics-card">

            <div class="analytics-card-header">
                <h3>${subject.subject_name}</h3>

                <span class="attendance-badge ${statusClass}">
                    ${percentage.toFixed(1)}%
                </span>
            </div>

            <div class="analytics-progress">
                <div
                    class="analytics-progress-fill ${statusClass}"
                    style="width:${Math.min(percentage, 100)}%">
                </div>
            </div>

            <div class="analytics-stats">

                <div>
                    <strong>${subject.present}</strong>
                    <span>Present</span>
                </div>

                <div>
                    <strong>${subject.absent}</strong>
                    <span>Absent</span>
                </div>

                <div>
                    <strong>${subject.total_classes}</strong>
                    <span>Total</span>
                </div>

            </div>

            <div class="analytics-footer">

                <div>
                    Required:
                    <strong>${required}%</strong>
                </div>

                <div>
                    Classes needed:
                    <strong>${subject.classes_needed}</strong>
                </div>

                <div>
                    Safe bunks:
                    <strong>${subject.safe_bunks}</strong>
                </div>

            </div>

        </div>
    `;
}


function renderAnalytics(data) {

    let subjects = [];

    if (data.type === "all") {
        subjects = data.subjects || [];
    } else {
        subjects = data.data
            ? [data.data]
            : [];
    }

    if (subjects.length === 0) {

        analyticsResult.innerHTML = `
            <div class="empty-state">
                No attendance data available.
            </div>
        `;

        return;
    }

    analyticsResult.innerHTML =
        `<div class="analytics-grid">
            ${subjects.map(createCard).join("")}
        </div>`;
}


async function loadAnalytics(subjectId = "") {

    analyticsResult.innerHTML =
        `<div class="loading">
            Loading analytics...
        </div>`;

    try {

        const endpoint =
            `/analytics/${subjectId || "all"}`;

        const response =
            await authFetch(endpoint);

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                `HTTP error! status: ${response.status}`
            );
        }

        renderAnalytics(data);

    } catch (error) {

        console.error(
            "Failed to load analytics:",
            error
        );

        analyticsResult.innerHTML = `
            <div class="error-state">
                Unable to load analytics.
            </div>
        `;
    }
}


analyticsSubjectSelect.addEventListener(
    "change",
    event => {
        loadAnalytics(event.target.value);
    }
);


async function initialize() {

    await loadSubjects();

    await loadAnalytics();
}


initialize();

