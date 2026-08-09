import { authFetch, logout } from "../../js/auth.js";
import { requireAuth } from "../../js/guard.js";

if (!requireAuth()) {
    throw new Error("Authentication required");
}
const username = document.getElementById("username");
const email = document.getElementById("email");

const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");

const updateBtn = document.getElementById("updateBtn");
const passwordBtn = document.getElementById("passwordBtn");
const deleteBtn = document.getElementById("deleteBtn");

async function loadProfile() {
    try {
        const response = await authFetch("/profile/");

        if (!response.ok) {
            throw new Error("Failed to load profile");
        }

        const data = await response.json();

        username.value = data.username;
        email.value = data.email;

    } catch (err) {
        console.error(err);
        alert("Unable to load profile");
    }
}

async function updateProfile() {

    try {

        const response = await authFetch("/profile/", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username.value,
                email: email.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error);
        }

        alert(data.message);

    } catch (err) {
        console.error(err);
        alert(err.message);
    }

}

async function changePassword() {

    try {

        const response = await authFetch("/profile/password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                old_password: currentPassword.value,
                new_password: newPassword.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error);
        }

        alert(data.message);

        currentPassword.value = "";
        newPassword.value = "";

    } catch (err) {
        console.error(err);
        alert(err.message);
    }

}

async function deleteAccount() {

    const ok = confirm(
        "Delete your account permanently?"
    );

    if (!ok) return;

    try {

        const response = await authFetch("/profile/", {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error);
        }

        alert(data.message);

        logout();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }

}

updateBtn.addEventListener(
    "click",
    updateProfile
);

passwordBtn.addEventListener(
    "click",
    changePassword
);

deleteBtn.addEventListener(
    "click",
    deleteAccount
);

loadProfile();