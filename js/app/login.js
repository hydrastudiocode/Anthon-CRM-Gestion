// Firebase Configuration
// const firebaseConfig = {
//    apiKey: "xxx",
//    authDomain: "xxx",
//    projectId: "xxx",
//    storageBucket: "xxx",
//    messagingSenderId: "xxx",
//    appId: "xxx"
//};
import { firebaseConfig } from './Configuraciones/firebase-config.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const toast = document.getElementById('toast');

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, redirect to main app
        window.location.href = 'inicio.html';
    }
});

// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Login form submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    // Validación básica
    if (!email || !password) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    // Disable button
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
    
    try {
        // Intentar iniciar sesión
        await auth.signInWithEmailAndPassword(email, password);
        
        showToast('¡Inicio de sesión exitoso!', 'success');
        
        // Redirect después de 1 segundo
        setTimeout(() => {
            window.location.href = 'inicio.html';
        }, 5000);
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Reset button
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Iniciar Sesión</span><i class="fas fa-arrow-right"></i>';
        
        // Mostrar mensaje de error amigable
        let errorMessage = 'Error al iniciar sesión';
        switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = 'Usuario o contraseña incorrectos';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Correo electrónico inválido';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos. Intenta más tarde';
                break;
            default:
                errorMessage = 'Error de conexión. Intenta de nuevo';
        }
        showToast(errorMessage, 'error');
    }
});

// Toast function
function showToast(message, type = 'info') {
    toast.className = `toast show ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Enter key for login
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});