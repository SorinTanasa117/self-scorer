import { onAuthStateChange, registerUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChange(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    const registerForm = document.getElementById('register-form');
    const registerErrorEl = document.getElementById('register-error');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerErrorEl.textContent = '';
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const { error } = await registerUser(email, password);
        if (error) {
            registerErrorEl.textContent = error.message;
        }
    });
});
