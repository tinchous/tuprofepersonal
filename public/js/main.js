/**
 * main.js - Funciones principales de la aplicación
 */

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  initAuthState();
  initToolCards();
});

// Inicializar estado de autenticación
function initAuthState() {
  const auth = checkAuthState();
  if (auth) {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = `${auth.nombre} (${auth.plan})`;
    updateToolAccess(auth.plan);
  }
}

// Actualizar acceso a herramientas según plan
function updateToolAccess(plan) {
  const accessRules = {
    'Dudas': ['tiz'],
    'Repaso': ['tiz', 'gte'],
    'Apoyo': ['tiz', 'gte', 'tep'],
    'Premium': ['tiz', 'gte', 'tep', 'tpp']
  };

  document.querySelectorAll('.tool-card').forEach(card => {
    const tool = card.getAttribute('onclick').match(/'(.*?)'/)[1];
    if (!accessRules[plan]?.includes(tool)) {
      card.classList.add('disabled-tool');
    } else {
      card.classList.remove('disabled-tool');
    }
  });
}

// Inicializar tarjetas de herramientas
function initToolCards() {
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', function() {
      if (this.classList.contains('disabled-tool')) {
        const requiredPlan = this.id.includes('gte') ? 'Repaso+' : 
                           this.id.includes('tep') ? 'Apoyo+' : 'Premium';
        alert(`Necesitas el plan ${requiredPlan} para acceder a esta herramienta`);
      }
    });
  });
}

// Verificar acceso a herramienta
function checkToolAccess(tool) {
  const auth = checkAuthState();
  if (!auth) {
    showAuthPopup('login');
    return false;
  }

  const accessRules = {
    'Dudas': ['tiz'],
    'Repaso': ['tiz', 'gte'],
    'Apoyo': ['tiz', 'gte', 'tep'],
    'Premium': ['tiz', 'gte', 'tep', 'tpp']
  };

  return accessRules[auth.plan]?.includes(tool) || false;
}
