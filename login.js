import { onAuthStateChange, loginUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChange(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    const loginForm = document.getElementById('login-form');
    const loginErrorEl = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorEl.textContent = '';
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const { error } = await loginUser(email, password);
        if (error) {
            loginErrorEl.textContent = error.message;
        }
    });
});
