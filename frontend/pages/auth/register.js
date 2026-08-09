import { setAuth, authFetch } from "../../js/auth.js";
console.log("REGISTER.JS VERSION 2 LOADED");
console.log(import.meta.url);
const form = document.getElementById("registerForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");
const formError = document.getElementById("formError");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("usernameError");
const emailError = document.getElementById("emailError");
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

    if (!emailInput.value.trim()) {
        showFieldError(emailInput, emailError, "Email is required");
        valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        showFieldError(emailInput, emailError, "Enter a valid email address");
        valid = false;
    } else {
        clearFieldError(emailInput, emailError);
    }

    if (!passwordInput.value) {
        showFieldError(passwordInput, passwordError, "Password is required");
        valid = false;
    } else if (passwordInput.value.length < 6) {
        showFieldError(passwordInput, passwordError, "Password must be at least 6 characters");
        valid = false;
    } else {
        clearFieldError(passwordInput, passwordError);
    }

    return valid;
}

async function handleRegister(event) {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    hideFormError();

    try {
        const response = await authFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error || "Registration failed");
        }

        if (data.access_token) {
            setAuth(data.access_token, data.user || { username: usernameInput.value.trim(), email: emailInput.value.trim() });
        }

        console.log("About to redirect...");
        console.log(window.location.href);

        window.location.href = "/pages/dashboard/index.html";

        console.log("This should never execute");
    } catch (error) {
        console.error("Registration error:", error);
        showFormError(error.message || "Registration failed");
    } finally {
        setLoading(false);
    }
}

usernameInput.addEventListener("input", () => clearFieldError(usernameInput, usernameError));
emailInput.addEventListener("input", () => clearFieldError(emailInput, emailError));
passwordInput.addEventListener("input", () => clearFieldError(passwordInput, passwordError));

form.addEventListener("submit", handleRegister);
