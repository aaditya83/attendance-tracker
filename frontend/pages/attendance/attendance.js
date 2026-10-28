import { authFetch } from "../../js/auth.js";

const attendanceSubjectSelect = document.getElementById("attendanceSubject");
const attendanceDateInput = document.getElementById("attendanceDate");
const markAttendanceBtn = document.getElementById("markAttendanceBtn");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const downloadExcelBtn = document.getElementById("downloadExcelBtn");
const templateExcelBtn = document.getElementById("templateExcelBtn");
const excelFileInput = document.getElementById("excelFileInput");
const excelStatus = document.getElementById("excelStatus");

let subjects = [];

function setExcelStatus(message, type = "info") {
    if (!excelStatus) return;

    excelStatus.textContent = message;
    excelStatus.className = `excel-status ${type}`;
}


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


async function downloadExcel() {
    setExcelStatus("Preparing Excel download...");

    try {
        const response = await authFetch("/excel/download");

        if (!response) return;

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || `HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "attendance.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
        setExcelStatus("Excel file downloaded successfully.", "success");

    } catch (error) {
        console.error("Failed to download Excel:", error);
        setExcelStatus(error.message, "error");
        alert(error.message);
    }
}

async function downloadTemplateExcel() {
    setExcelStatus("Preparing Excel template...");

    try {
        const response = await authFetch("/excel/template");

        if (!response) return;

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || `HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "attendance_template.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
        setExcelStatus("Excel template downloaded successfully.", "success");

    } catch (error) {
        console.error("Failed to download Excel template:", error);
        setExcelStatus(error.message, "error");
        alert(error.message);
    }
}

async function uploadExcel(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
        setExcelStatus("Please choose an .xlsx file.", "error");
        event.target.value = "";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setExcelStatus("Uploading Excel file...");

    try {
        const response = await authFetch("/excel/upload", {
            method: "POST",
            body: formData
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

        const summary = [
            `Imported: ${data.imported ?? 0}`,
            `Skipped: ${data.skipped ?? 0}`
        ];

        if (data.errors?.length) {
            summary.push("", "Errors:");
            summary.push(...data.errors.map(error => `• ${error}`));
        }

        setExcelStatus(
            summary.join("\n"),
            data.errors?.length ? "error" : "success"
        );

        event.target.value = "";
        await loadAttendance();

    } catch (error) {
        console.error("Failed to upload Excel:", error);
        setExcelStatus(error.message, "error");
        alert(error.message);
    }
}

async function initialize() {
    await loadSubjects();
    await loadAttendance();
}

if (downloadExcelBtn) {
    downloadExcelBtn.addEventListener("click", downloadExcel);
}

if (templateExcelBtn) {
    templateExcelBtn.addEventListener("click", downloadTemplateExcel);
}

if (excelFileInput) {
    excelFileInput.addEventListener("change", uploadExcel);
}

initialize();

