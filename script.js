document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const loginForm = document.getElementById('loginForm');
    const appContent = document.getElementById('appContent');
    const userIcon = document.getElementById('userIcon');
    const userDialog = document.getElementById('userDialog');
    const showLogin = document.getElementById('showLogin');
    const showReg = document.getElementById('showReg');
    const signOutBtn = document.getElementById('signOutBtn');

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registrationForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    showReg.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registrationForm.style.display = 'block';
    });

    userIcon.addEventListener('click', () => {
        userDialog.style.display = userDialog.style.display === 'none' ? 'block' : 'none';
    });

    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                user.sendEmailVerification();
                db.collection('users').doc(user.uid).set({
                    name: name
                });
                alert('Registration successful! Please check your email to verify your account.');
                registrationForm.style.display = 'none';
                loginForm.style.display = 'block';
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                if (user.emailVerified) {
                    loginForm.style.display = 'none';
                    appContent.style.display = 'block';
                    userIcon.style.display = 'block';
                } else {
                    alert('Please verify your email before logging in.');
                    auth.signOut();
                }
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    signOutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            appContent.style.display = 'none';
            userIcon.style.display = 'none';
            userDialog.style.display = 'none';
            loginForm.style.display = 'block';
        });
    });

    auth.onAuthStateChanged((user) => {
        if (user && user.emailVerified) {
            loginForm.style.display = 'none';
            registrationForm.style.display = 'none';
            appContent.style.display = 'block';
            userIcon.style.display = 'block';
            db.collection('users').doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    document.getElementById('userName').textContent = doc.data().name;
                }
            });
        } else {
            appContent.style.display = 'none';
            userIcon.style.display = 'none';
            userDialog.style.display = 'none';
            loginForm.style.display = 'none';
            registrationForm.style.display = 'block';
        }
    });
});
