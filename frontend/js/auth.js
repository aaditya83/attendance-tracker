const API_BASE = window.location.origin;

function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
    localStorage.setItem("token", token);

    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/auth/login.html";
}

async function authFetch(endpoint, options = {}) {
    const token = getToken();

    if (!token) {
        logout();
        return null;
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/pages/auth/login.html";
        return null;
    }

    return response;
}

export {
    API_BASE,
    setAuth,
    getToken,
    getUser,
    logout,
    authFetch
};

