
import { setAuth, authFetch } from "../../js/auth.js";

const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");
const formError = document.getElementById("formError");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");

function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.classList.toggle("hidden", loading);
    btnLoader.classList.toggle("hidden", !loading);
}

function showFieldError(input, errorEl, message) {
    input.classList.add("error");
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
}

function clearFieldError(input, errorEl) {
    input.classList.remove("error");
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
}

function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove("hidden");
}

function hideFormError() {
    formError.classList.add("hidden");
}

function validateForm() {
    let valid = true;
    hideFormError();

    if (!usernameInput.value.trim()) {
        showFieldError(usernameInput, usernameError, "Username is required");
        valid = false;
    } else {
        clearFieldError(usernameInput, usernameError);
    }

    if (!passwordInput.value) {
        showFieldError(passwordInput, passwordError, "Password is required");
        valid = false;
    } else {
        clearFieldError(passwordInput, passwordError);
    }

    return valid;
}

async function handleLogin(event) {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    hideFormError();

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                password: passwordInput.value,
            }),
        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error || data.message || "Login failed");
        }

        setAuth(data.access_token, data.user);

        window.location.href = "../dashboard/index.html";

    } catch (error) {
        console.error("Login error:", error);
        showFormError(error.message || "Invalid email or password");
    } finally {
        setLoading(false);
    }
}

// Clear field errors on input
usernameInput.addEventListener("input", () => clearFieldError(usernameInput, usernameError));
passwordInput.addEventListener("input", () => clearFieldError(passwordInput, passwordError));

form.addEventListener("submit", handleLogin);