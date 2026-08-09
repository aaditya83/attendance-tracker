import { authFetch } from "../../js/auth.js";

const attendanceSubjectSelect = document.getElementById("attendanceSubject");
const attendanceDateInput = document.getElementById("attendanceDate");
const markAttendanceBtn = document.getElementById("markAttendanceBtn");
const attendanceTableBody = document.getElementById("attendanceTableBody");

let subjects = [];


async function loadSubjects() {
    try {
        const response = await authFetch("/subjects/");

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || `HTTP error! status: ${response.status}`
            );
        }

        subjects = data;

        attendanceSubjectSelect.innerHTML =
            `<option value="">Select a subject...</option>` +
            subjects.map(subject =>
                `<option value="${subject.id}">
                    ${subject.name}
                </option>`
            ).join("");

    } catch (error) {
        console.error("Failed to load subjects:", error);
    }
}


async function loadAttendance() {
    try {
        const response = await authFetch("/attendance/");

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || `HTTP error! status: ${response.status}`
            );
        }

        renderAttendance(data);

    } catch (error) {
        console.error("Failed to load attendance:", error);

        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load attendance.
                </td>
            </tr>
        `;
    }
}


function getSubjectName(subjectId) {
    const subject = subjects.find(
        subject => subject.id === subjectId
    );

    return subject ? subject.name : "Unknown Subject";
}


function renderAttendance(records) {

    if (!records.length) {
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    No attendance records found.
                </td>
            </tr>
        `;
        return;
    }

    attendanceTableBody.innerHTML = records.map(record => {

        const status = record.status.toLowerCase();

        return `
            <tr>
                <td>${getSubjectName(record.subject_id)}</td>
                <td>${record.date}</td>
                <td>
                    <span class="status ${status}">
                        ${record.status}
                    </span>
                </td>
                <td>
                    <button
                        class="delete-btn"
                        data-id="${record.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    }).join("");
}


async function markAttendance() {

    const subjectId = attendanceSubjectSelect.value;
    const date = attendanceDateInput.value;

    const status =
        document.querySelector(
            'input[name="attendanceStatus"]:checked'
        )?.value || "present";

    if (!subjectId || !date) {
        alert("Select a subject and date.");
        return;
    }

    try {

        const response = await authFetch("/attendance/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                subject_id: subjectId,
                date: date,
                status: status
            })
        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                `HTTP error! status: ${response.status}`
            );
        }

        alert("Attendance marked successfully.");

        await loadAttendance();

    } catch (error) {
        console.error("Failed to mark attendance:", error);
        alert(error.message);
    }
}


async function deleteAttendance(id) {

    if (!confirm("Delete this attendance record?")) {
        return;
    }

    try {

        const response = await authFetch(
            `/attendance/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                `HTTP error! status: ${response.status}`
            );
        }

        await loadAttendance();

    } catch (error) {
        console.error("Failed to delete attendance:", error);
        alert(error.message);
    }
}


attendanceTableBody.addEventListener("click", event => {

    const button = event.target.closest(".delete-btn");

    if (!button) return;

    deleteAttendance(button.dataset.id);
});


if (!attendanceDateInput.value) {
    attendanceDateInput.value =
        new Date().toISOString().split("T")[0];
}


markAttendanceBtn.addEventListener(
    "click",
    markAttendance
);


async function initialize() {
    await loadSubjects();
    await loadAttendance();
}

initialize();

