import { getToken, logout } from "./auth.js";

export function requireAuth() {
    const token = getToken();

    if (!token) {
        window.location.href = "/pages/auth/login.html";
        return false;
    }

    return true;
}