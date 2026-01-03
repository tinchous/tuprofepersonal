/**
 * auth.js - Módulo de autenticación
 * Maneja registro, login, logout y verificación de sesión
 */

const AUTH_KEY = 'profePersonalAuth';

// Usuarios demo (en producción usar backend real)
const demoUsers = {
  'alumno@ejemplo.com': {
    id: 1,
    nombre: 'Alumno Demo',
    email: 'alumno@ejemplo.com',
    password: 'Demo123!',
    plan: 'Repaso',
    materias: ['Matemáticas']
  },
  'profesor@ejemplo.com': {
    id: 2,
    nombre: 'Profesor Demo',
    email: 'profesor@ejemplo.com',
    password: 'Demo123!',
    plan: 'Premium',
    materias: ['Matemáticas', 'Física', 'Química']
  }
};

// Iniciar sesión
function login(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!demoUsers[email] || demoUsers[email].password !== password) {
        reject(new Error('Credenciales incorrectas'));
        return;
      }
      
      const { password: _, ...user } = demoUsers[email];
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      resolve(user);
    }, 800);
  });
}

// Registrar nuevo usuario
function register(userData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (demoUsers[userData.email]) {
        reject(new Error('El email ya está registrado'));
        return;
      }
      
      if (userData.password.length < 8) {
        reject(new Error('La contraseña debe tener al menos 8 caracteres'));
        return;
      }
      
      const newUser = {
        id: Object.keys(demoUsers).length + 1,
        nombre: userData.nombre,
        email: userData.email,
        password: userData.password,
        plan: userData.plan || 'Dudas',
        materias: [],
        fechaRegistro: new Date().toISOString().split('T')[0]
      };
      
      demoUsers[userData.email] = newUser;
      const { password: _, ...user } = newUser;
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      resolve(user);
    }, 1000);
  });
}

// Cerrar sesión
function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'prope.30.1.html';
}

// Verificar estado de autenticación
function checkAuthState() {
  const authData = localStorage.getItem(AUTH_KEY);
  if (!authData) {
    return null;
  }
  return JSON.parse(authData);
}

// Mostrar popup de autenticación
function showAuthPopup(type) {
  const popup = document.getElementById('popup');
  const content = document.getElementById('popupContent');
  
  if (type === 'login') {
    content.innerHTML = `
      <h3>Iniciar Sesión</h3>
      <input type="email" id="loginEmail" placeholder="Correo electrónico" value="alumno@ejemplo.com">
      <input type="password" id="loginPassword" placeholder="Contraseña" value="Demo123!">
      <button onclick="handleLogin()">Ingresar</button>
      <p>¿No tienes cuenta? <a href="#" onclick="showAuthPopup('register')">Regístrate aquí</a></p>
    `;
  } else {
    content.innerHTML = `
      <h3>Registrarse</h3>
      <input type="text" id="regName" placeholder="Nombre completo">
      <input type="email" id="regEmail" placeholder="Correo electrónico">
      <input type="password" id="regPassword" placeholder="Contraseña (mín. 8 caracteres)">
      <select id="regPlan">
        <option value="Dudas">Plan Dudas (Gratis)</option>
        <option value="Repaso">Plan Repaso+</option>
        <option value="Apoyo">Plan Apoyo+</option>
        <option value="Premium">Plan Premium</option>
      </select>
      <button onclick="handleRegister()">Crear cuenta</button>
      <p>¿Ya tienes cuenta? <a href="#" onclick="showAuthPopup('login')">Inicia sesión</a></p>
    `;
  }
  
  popup.style.display = 'flex';
}

// Manejador de login
async function handleLogin() {
  try {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await login(email, password);
    window.location.reload();
  } catch (error) {
    alert(error.message);
  }
}

// Manejador de registro
async function handleRegister() {
  try {
    const userData = {
      nombre: document.getElementById('regName').value,
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value,
      plan: document.getElementById('regPlan').value
    };
    await register(userData);
    window.location.reload();
  } catch (error) {
    alert(error.message);
  }
}

// Exportar funciones para uso global
window.login = login;
window.register = register;
window.logout = logout;
window.checkAuthState = checkAuthState;
window.showAuthPopup = showAuthPopup;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
