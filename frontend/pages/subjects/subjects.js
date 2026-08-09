import { authFetch, getUser } from "../../js/auth.js";

const addSubjectBtn = document.getElementById("addSubjectBtn");
const subjectModal = document.getElementById("subjectModal");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const subjectForm = document.getElementById("subjectForm");
const modalTitle = document.getElementById("modalTitle");

const subjectId = document.getElementById("subjectId");
const subjectName = document.getElementById("subjectName");
const subjectFaculty = document.getElementById("subjectFaculty");
const subjectRequired = document.getElementById("subjectRequired");

const subjectsTableBody = document.getElementById("subjectsTableBody");

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

function openModal() {
    subjectForm.reset();
    subjectId.value = "";
    subjectRequired.value = 75;
    modalTitle.textContent = "Add Subject";
    subjectModal.classList.remove("hidden");
}

function closeSubjectModal() {
    subjectModal.classList.add("hidden");
}

async function loadSubjects() {
    try {
        const response = await authFetch("/subjects/");

        if (!response) return;

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || `HTTP error! status: ${response.status}`);
        }

        const subjects = await response.json();

        if (subjects.length === 0) {
            subjectsTableBody.innerHTML = `
                <tr>
                    <td colspan="4">No subjects found</td>
                </tr>
            `;
            return;
        }

        subjectsTableBody.innerHTML = subjects.map(subject => `
            <tr>
                <td>${subject.name}</td>
                <td>${subject.faculty}</td>
                <td>${subject.required_attendance}%</td>
                <td>
                    <button class="edit-btn" data-id="${subject.id}">Edit</button>
                    <button class="delete-btn" data-id="${subject.id}">Delete</button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", () => editSubject(button.dataset.id));
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", () => deleteSubject(button.dataset.id));
        });

    } catch (error) {
        console.error("Failed to load subjects:", error);
    }
}

async function saveSubject(event) {
    event.preventDefault();

    const id = subjectId.value;

    const subjectData = {
        name: subjectName.value.trim(),
        faculty: subjectFaculty.value.trim(),
        required_attendance: Number(subjectRequired.value)
    };

    if (!subjectData.name || !subjectData.faculty) {
        alert("Please fill all fields");
        return;
    }

    try {
        let response;

        if (id) {
            response = await authFetch(`/subjects/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(subjectData)
            });
        } else {
            response = await authFetch("/subjects/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(subjectData)
            });
        }

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error || "Failed to save subject");
        }

        closeSubjectModal();
        await loadSubjects();

    } catch (error) {
        console.error("Failed to save subject:", error);
        alert(error.message);
    }
}

async function editSubject(id) {
    try {
        const response = await authFetch(`/subjects/${id}`);

        if (!response) return;

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const subject = await response.json();

        subjectId.value = subject.id;
        subjectName.value = subject.name;
        subjectFaculty.value = subject.faculty;
        subjectRequired.value = subject.required_attendance;

        modalTitle.textContent = "Edit Subject";
        subjectModal.classList.remove("hidden");

    } catch (error) {
        console.error("Failed to load subject:", error);
        alert(error.message);
    }
}

async function deleteSubject(id) {
    if (!confirm("Are you sure you want to delete this subject?")) {
        return;
    }

    try {
        const response = await authFetch(`/subjects/${id}`, {
            method: "DELETE"
        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error || "Failed to delete subject");
        }

        await loadSubjects();

    } catch (error) {
        console.error("Failed to delete subject:", error);
        alert(error.message);
    }
}

addSubjectBtn.addEventListener("click", openModal);
closeModal.addEventListener("click", closeSubjectModal);
cancelModal.addEventListener("click", closeSubjectModal);

subjectModal.querySelector(".modal-backdrop")
    .addEventListener("click", closeSubjectModal);

subjectForm.addEventListener("submit", saveSubject);

loadSubjects();

