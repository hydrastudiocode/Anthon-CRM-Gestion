// State
let currentPage = 'dashboard';
let editingClienteId = null;
let editingNotaGeneralId = null;
let editingTareaGeneralId = null;
let currentClienteNotas = [];
let currentClienteTareas = [];
let currentUser = null;
let inactivityTimeout;
const INACTIVITY_LIMIT = 6 * 60 * 1000; // 

let offlineData = {
    clientes: [],
    notasGenerales: [],
    tareasGenerales: []
};

// Función para resetear el timeout de inactividad
function resetInactivityTimeout() {
    // Limpiar el timeout anterior
    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
    }
    
    // Configurar nuevo timeout
    inactivityTimeout = setTimeout(() => {
        // Mostrar advertencia antes de cerrar
        showInactivityWarning();
    }, INACTIVITY_LIMIT);
}


// Función para mostrar advertencia de inactividad
function showInactivityWarning() {
    // Crear modal de advertencia
    const warningModal = document.createElement('div');
    warningModal.className = 'inactivity-modal';
    warningModal.id = 'inactivityModal';
    warningModal.innerHTML = `
        <div class="inactivity-content">
            <i class="fas fa-clock"></i>
            <h3>¿Sigues ahí?</h3>
            <p>Has estado inactivo por 5 minutos. Por seguridad, cerraremos tu sesión en 1 minuto si no hay actividad.</p>
            <div class="inactivity-timer" id="inactivityTimer">60</div>
            <button class="btn-primary" id="stayLoggedInBtn">
                Seguir aquí
            </button>
        </div>
    `;
    
    document.body.appendChild(warningModal);
    
    // Mostrar con animación
    setTimeout(() => {
        warningModal.classList.add('show');
    }, 10);
    
    // Timer de cuenta regresiva
    let secondsLeft = 60;
    const timerElement = document.getElementById('inactivityTimer');
    
    const countdown = setInterval(() => {
        secondsLeft--;
        if (timerElement) {
            timerElement.textContent = secondsLeft;
        }
        
        if (secondsLeft <= 0) {
            clearInterval(countdown);
            // Cerrar sesión
            forceLogout();
        }
    }, 1000);
    
    // Botón para permanecer logueado
    document.getElementById('stayLoggedInBtn').addEventListener('click', () => {
        clearInterval(countdown);
        warningModal.classList.remove('show');
        setTimeout(() => {
            warningModal.remove();
        }, 300);
        resetInactivityTimeout();
    });
    
    // Guardar el interval para limpiarlo después
    window.inactivityCountdown = countdown;
}

// Función para forzar cierre de sesión
function forceLogout() {
    // Limpiar cualquier modal abierto
    const warningModal = document.getElementById('inactivityModal');
    if (warningModal) {
        warningModal.remove();
    }
    
    // Mostrar notificación
    showNotification('Sesión cerrada por inactividad', 'warning');
    
    // Cerrar sesión
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
        // Forzar redirección aunque haya error
        window.location.href = 'index.html';
    });
}

// Función para configurar los detectores de actividad
function setupActivityDetectors() {
    // Lista de eventos que indican actividad del usuario
    const activityEvents = [
        'mousedown', 'mousemove', 'keydown', 'scroll',
        'touchstart', 'click', 'wheel', 'mousewheel'
    ];
    
    // Función para resetear el timeout en cada actividad
    const handleActivity = () => {
        resetInactivityTimeout();
    };
    
    // Agregar listeners para cada evento
    activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity);
    });
    
    // También resetear cuando hay interacción con modales
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' &&
                mutation.target.classList.contains('active')) {
                resetInactivityTimeout();
            }
        });
    });
    
    // Observar cambios en los modales
    document.querySelectorAll('.modal').forEach(modal => {
        modalObserver.observe(modal, { attributes: true });
    });
    
    // Iniciar el timeout
    resetInactivityTimeout();
}
// State

// ... (resto de las variables de estado)

// Check authentication FIRST - esto redirige si no hay usuario
// Check authentication FIRST - esto redirige si no hay usuario
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        currentUser = {
            uid: user.uid,
            email: user.email,
            name: user.email ? user.email.split('@')[0] : 'Usuario'
        };
        
        // Update user info in sidebar (sin sobrescribir todo el HTML)
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <div>
                    <span>${currentUser.name}</span>
                    <small style="display: block; font-size: 10px;">${currentUser.email}</small>
                </div>
            `;
        }
        
        // Initialize the app SOLO UNA VEZ
        if (!window.appInitialized) {
            window.appInitialized = true;
            initializeApp();
        }
    } else {
        // No user, redirect to login
        window.location.href = 'index.html';
    }
});

function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
        showNotification('Error al cerrar sesión', 'error');
    });
}

function initializeApp() {
    console.log('App initialized');
    
    // Check connection
    checkConnection();
    
    // Setup listeners (solo si no están ya configurados)
    if (!window.listenersSetup) {
        setupEventListeners();
        window.listenersSetup = true;
    }
    
    // Configurar detectores de inactividad
    setupActivityDetectors();
    
    checkSavedTheme();
    loadData();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', logout);
        console.log('Logout button configured');
    }
    
    updateBadges();
    setTimeout(updateUserInfo, 100);
}


function showToast(message, type) {
    // Función para mostrar notificaciones
    const toast = document.getElementById('toast');
    toast.className = `toast show ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ... (resto de las funciones del CRM que ya teníamos)
function getUserEmail() {
    return currentUser ? currentUser.email : 'No identificado';
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });

    // Menu toggle
// En setupEventListeners, actualiza el menú toggle:
document.getElementById('menuToggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    } else {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Cerrar sidebar al hacer click en overlay
document.getElementById('sidebarOverlay').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
});

// Cerrar sidebar al cambiar de página en móvil
document.querySelectorAll('.nav-main .nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});
// Manejar resize de ventana
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Add button
    document.getElementById('addBtn').addEventListener('click', () => {
        openAddModal();
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Modal closes
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Cliente modal
    document.getElementById('cancelClienteBtn')?.addEventListener('click', closeAllModals);
    document.getElementById('saveClienteBtn')?.addEventListener('click', saveCliente);
    document.getElementById('agregarNotaCliente')?.addEventListener('click', agregarNotaCliente);
    document.getElementById('agregarTareaCliente')?.addEventListener('click', agregarTareaCliente);

    // Nota general modal
    document.getElementById('cancelNotaGeneralBtn')?.addEventListener('click', closeAllModals);
    document.getElementById('saveNotaGeneralBtn')?.addEventListener('click', saveNotaGeneral);

    // Tarea general modal
    document.getElementById('cancelTareaGeneralBtn')?.addEventListener('click', closeAllModals);
    document.getElementById('saveTareaGeneralBtn')?.addEventListener('click', saveTareaGeneral);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Filters
    document.getElementById('rubroFilter')?.addEventListener('change', filterClientes);
    document.getElementById('estadoFilter')?.addEventListener('change', filterClientes);
    document.getElementById('pagoFilter')?.addEventListener('change', filterClientes);
    document.getElementById('categoriaFilter')?.addEventListener('change', filterNotasGenerales);
    document.getElementById('prioridadFilter')?.addEventListener('change', filterTareasGenerales);
    document.getElementById('estadoTareaFilter')?.addEventListener('change', filterTareasGenerales);

    // Edit from detail
    document.getElementById('editarDesdeDetalle')?.addEventListener('click', () => {
        if (editingClienteId) {
            closeAllModals();
            openClienteModal(editingClienteId);
        }
    });
}

// Navigation
function navigateTo(page) {
    currentPage = page;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');

    const addBtn = document.getElementById('addBtn');
    if (page === 'dashboard') {
        addBtn.style.display = 'none';
    } else {
        addBtn.style.display = 'flex';
        let text = 'Agregar ';
        if (page === 'clientes') text += 'Cliente';
        else if (page === 'notas-generales') text += 'Nota General';
        else if (page === 'tareas-generales') text += 'Tarea General';
        addBtn.innerHTML = `<i class="fas fa-plus"></i> ${text}`;
    }
}

// Theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#themeToggle i');
    icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('#themeToggle i').className = 'fas fa-sun';
    }
}

// Connection
function checkConnection() {
    if (!navigator.onLine) {
        showNotification('Trabajando en modo offline', 'warning');
        loadOfflineData();
    }
    
    window.addEventListener('online', () => {
        showNotification('Conexión restablecida', 'success');
        syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
        showNotification('Sin conexión - trabajando offline', 'warning');
    });
}

function loadOfflineData() {
    const saved = localStorage.getItem('crmOfflineData');
    if (saved) {
        offlineData = JSON.parse(saved);
        renderAllFromOffline();
    }
}

function saveOfflineData() {
    localStorage.setItem('crmOfflineData', JSON.stringify(offlineData));
}

function renderAllFromOffline() {
    renderClientes(offlineData.clientes);
    renderNotasGenerales(offlineData.notasGenerales);
    renderTareasGenerales(offlineData.tareasGenerales);
    updateDashboard();
    updateBadges();
}

// Load Data
function loadData() {
    // Load clients
    database.ref('clientes').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const clientes = Object.entries(data).map(([id, value]) => ({ id, ...value }));
            offlineData.clientes = clientes;
            saveOfflineData();
            renderClientes(clientes);
        } else {
            renderClientes([]);
        }
        updateDashboard();
        updateBadges();
    }, (error) => {
        console.warn('Error loading clients:', error);
        renderClientes(offlineData.clientes);
    });

    // Load general notes
    database.ref('notasGenerales').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const notas = Object.entries(data).map(([id, value]) => ({ id, ...value }));
            offlineData.notasGenerales = notas;
            saveOfflineData();
            renderNotasGenerales(notas);
        } else {
            renderNotasGenerales([]);
        }
        updateDashboard();
        updateBadges();
    }, (error) => {
        console.warn('Error loading notes:', error);
        renderNotasGenerales(offlineData.notasGenerales);
    });

    // Load general tasks
    database.ref('tareasGenerales').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const tareas = Object.entries(data).map(([id, value]) => ({ id, ...value }));
            offlineData.tareasGenerales = tareas;
            saveOfflineData();
            renderTareasGenerales(tareas);
        } else {
            renderTareasGenerales([]);
        }
        updateDashboard();
        updateBadges();
    }, (error) => {
        console.warn('Error loading tasks:', error);
        renderTareasGenerales(offlineData.tareasGenerales);
    });
}

// Render Clients
function renderClientes(clientes) {
    const container = document.getElementById('clientesList');
    if (!container) return;

    if (!clientes || clientes.length === 0) {
        container.innerHTML = '<p class="no-data">No hay clientes</p>';
        return;
    }

    container.innerHTML = clientes.map(cliente => `
        <div class="card clickable-card" onclick="verDetalleCliente('${cliente.id}')">
            <div class="card-header">
                <h3>${cliente.nombre || 'Sin nombre'}</h3>
                <span class="badge ${cliente.estado || 'pendiente'}">${cliente.estado || 'pendiente'}</span>
            </div>
            <div class="card-content">
                <p><i class="fas fa-briefcase"></i> ${cliente.rubro || 'N/A'}</p>
                <p><i class="fas fa-project-diagram"></i> ${cliente.proyecto || 'N/A'}</p>
                <p><i class="fas fa-dollar-sign"></i> $${cliente.costo || 0}</p>
                <p><i class="fas fa-credit-card"></i> ${cliente.pago || 'pendiente'}</p>
                <p><i class="fas fa-phone"></i> ${cliente.telefono1 || 'Sin teléfono'}</p>
            </div>
            <div class="card-footer">
                <small>${cliente.notas ? `${cliente.notas.length} notas` : '0 notas'} • ${cliente.tareas ? cliente.tareas.filter(t => !t.completada).length : 0} tareas pendientes</small>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button onclick="editarCliente('${cliente.id}')"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarCliente('${cliente.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    updateRubroFilter(clientes);
}

// Render General Notes
function renderNotasGenerales(notas) {
    const container = document.getElementById('notasGeneralesList');
    if (!container) return;

    if (!notas || notas.length === 0) {
        container.innerHTML = '<p class="no-data">No hay notas generales</p>';
        return;
    }

    container.innerHTML = notas.map(nota => `
        <div class="card clickable-card" style="border: 2px solid ${nota.color || '#3498db'}" onclick="verDetalleNotaGeneral('${nota.id}')">
            <div class="card-header">
                <h3>${nota.titulo || 'Sin título'}</h3>
                <span class="badge">${nota.categoria || 'general'}</span>
            </div>
            <div class="card-content">
            <p class="contenido-preview">${nota.contenido ? nota.contenido : ''}</p>
                ${nota.etiquetas ? `
                    <div class="tags">
                        ${nota.etiquetas.split(',').map(e => `<span class="tag">${e.trim()}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <small><i class="fas fa-clock"></i> ${formatDate(nota.fecha)} · <span class="crm-tap-hint">toca para ver completa</span></small>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button onclick="editarNotaGeneral('${nota.id}')"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarNotaGeneral('${nota.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// Render General Tasks
function renderTareasGenerales(tareas) {
    const container = document.getElementById('tareasGeneralesList');
    if (!container) return;

    if (!tareas || tareas.length === 0) {
        container.innerHTML = '<p class="no-data">No hay tareas generales</p>';
        return;
    }

    container.innerHTML = tareas.map(tarea => `
        <div class="task-general-item prioridad-${tarea.prioridad || 'media'} clickable-card" onclick="verDetalleTareaGeneral('${tarea.id}')">
            <div class="task-general-header">
                <span class="task-general-titulo" style="${tarea.estado === 'completada' ? 'text-decoration:line-through; opacity:.6;' : ''}">${tarea.titulo}</span>
                <span class="task-general-estado ${tarea.estado || 'pendiente'}">${tarea.estado || 'pendiente'}</span>
            </div>
            ${tarea.descripcion ? `<div class="task-general-descripcion descripcion-preview">${tarea.descripcion}</div>` : ''}
            <div class="task-general-footer">
                <div class="task-general-etiquetas">
                    ${tarea.etiquetas ? tarea.etiquetas.split(',').map(e => 
                        `<span class="task-general-etiqueta">${e.trim()}</span>`
                    ).join('') : ''}
                </div>
                <div>
                    ${tarea.fechaLimite ? `<i class="fas fa-calendar"></i> ${formatDate(tarea.fechaLimite)}` : ''}
                </div>
            </div>
            <div class="crm-tap-hint">
        
            </div>
            <div class="card-actions" style="margin-top: 10px;" onclick="event.stopPropagation()">
                <button onclick="toggleTareaGeneral('${tarea.id}')" title="${tarea.estado === 'completada' ? 'Marcar pendiente' : 'Marcar completada'}">
                    <i class="fas ${tarea.estado === 'completada' ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button onclick="editarTareaGeneral('${tarea.id}')"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarTareaGeneral('${tarea.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// Dashboard
function updateDashboard() {
    const totalClientes = offlineData.clientes.length;
    const totalNotas = offlineData.notasGenerales.length + 
        offlineData.clientes.reduce((sum, c) => sum + (c.notas ? c.notas.length : 0), 0);
    const totalTareas = offlineData.tareasGenerales.length + 
        offlineData.clientes.reduce((sum, c) => sum + (c.tareas ? c.tareas.length : 0), 0);
    const tareasCompletadas = offlineData.tareasGenerales.filter(t => t.estado === 'completada').length +
        offlineData.clientes.reduce((sum, c) => sum + (c.tareas ? c.tareas.filter(t => t.completada).length : 0), 0);

    document.getElementById('totalClientes').textContent = totalClientes;
    document.getElementById('totalNotas').textContent = totalNotas;
    document.getElementById('totalTareas').textContent = totalTareas;
    document.getElementById('tareasCompletadas').textContent = tareasCompletadas;

    document.getElementById('notasDesglose').textContent = 
        `(${totalNotas - offlineData.notasGenerales.length} de clientes)`;
    document.getElementById('tareasDesglose').textContent = 
        `(${totalTareas - offlineData.tareasGenerales.length} de clientes)`;

    // Últimos clientes
    const ultimosClientes = offlineData.clientes.slice(-5).reverse();
    document.getElementById('ultimosClientes').innerHTML = ultimosClientes.map(c => `
        <div class="compact-item">
            <i class="fas fa-user"></i>
            <span class="item-title">${c.nombre}</span>
            <span class="item-meta">${c.rubro || 'N/A'}</span>
        </div>
    `).join('') || '<p class="no-data">No hay clientes</p>';

    // Próximas tareas
    const todasTareas = [
        ...offlineData.tareasGenerales.map(t => ({ ...t, tipo: 'general' })),
        ...offlineData.clientes.flatMap(c => (c.tareas || []).map(t => ({ ...t, cliente: c.nombre, tipo: 'cliente' })))
    ].filter(t => t.estado !== 'completada').slice(0, 5);

    document.getElementById('proximasTareas').innerHTML = todasTareas.map(t => `
        <div class="compact-item">
            <i class="fas fa-tasks"></i>
            <span class="item-title">${t.titulo || t.texto}</span>
            <span class="item-meta">${t.cliente ? t.cliente : 'General'}</span>
        </div>
    `).join('') || '<p class="no-data">No hay tareas pendientes</p>';

    // Notas recientes
    const todasNotas = [
        ...offlineData.notasGenerales.map(n => ({ ...n, tipo: 'general' })),
        ...offlineData.clientes.flatMap(c => (c.notas || []).map(n => ({ ...n, cliente: c.nombre, tipo: 'cliente' })))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

    document.getElementById('notasRecientes').innerHTML = todasNotas.map(n => `
        <div class="compact-item">
            <i class="fas fa-sticky-note"></i>
            <span class="item-title">${n.titulo || n.contenido?.substring(0, 30)}</span>
            <span class="item-meta">${n.cliente ? n.cliente : 'General'}</span>
        </div>
    `).join('') || '<p class="no-data">No hay notas</p>';
}

// Update badges
function updateBadges() {
    document.getElementById('clientesBadge').textContent = offlineData.clientes.length;
    document.getElementById('notasBadge').textContent = offlineData.notasGenerales.length;
    document.getElementById('tareasBadge').textContent = offlineData.tareasGenerales.length;
}

// Modal functions
function openAddModal() {
    if (currentPage === 'clientes') {
        openClienteModal();
    } else if (currentPage === 'notas-generales') {
        openNotaGeneralModal();
    } else if (currentPage === 'tareas-generales') {
        openTareaGeneralModal();
    }
}

function openClienteModal(clienteId = null) {
    editingClienteId = clienteId;
    document.getElementById('clienteModalTitle').textContent = clienteId ? 'Editar Cliente' : 'Nuevo Cliente';
    
    // Reset form
    document.getElementById('clienteForm').reset();
    currentClienteNotas = [];
    currentClienteTareas = [];
    
    if (clienteId) {
        const cliente = offlineData.clientes.find(c => c.id === clienteId);
        if (cliente) {
            document.getElementById('clienteNombre').value = cliente.nombre || '';
            document.getElementById('clienteRubro').value = cliente.rubro || '';
            document.getElementById('clienteEstado').value = cliente.estado || 'activo';
            document.getElementById('clienteEtiquetas').value = cliente.etiquetas || '';
            document.getElementById('clienteEmail').value = cliente.email || '';
            document.getElementById('clienteTelefono1').value = cliente.telefono1 || '';
            document.getElementById('clienteTelefono2').value = cliente.telefono2 || '';
            document.getElementById('clienteWhatsapp').value = cliente.whatsapp || '';
            document.getElementById('clienteDireccion').value = cliente.direccion || '';
            document.getElementById('clienteInstagram').value = cliente.instagram || '';
            document.getElementById('clienteFacebook').value = cliente.facebook || '';
            document.getElementById('clienteProyecto').value = cliente.proyecto || '';
            document.getElementById('clienteCosto').value = cliente.costo || '';
            document.getElementById('clientePago').value = cliente.pago || 'pendiente';
            document.getElementById('clienteMetodoPago').value = cliente.metodoPago || '';
            document.getElementById('clienteLink').value = cliente.link || '';
            document.getElementById('clienteFechaEntrega').value = cliente.fechaEntrega || '';
            document.getElementById('clienteObservaciones').value = cliente.observaciones || '';
            
            currentClienteNotas = cliente.notas || [];
            currentClienteTareas = cliente.tareas || [];
        }
    }
    
    renderNotasCliente();
    renderTareasCliente();
    
    document.getElementById('clienteModal').classList.add('active');
}

function renderNotasCliente() {
    const container = document.getElementById('notasClienteList');
    container.innerHTML = currentClienteNotas.map((nota, index) => `
        <div class="nota-cliente-item">
            <div class="nota-cliente-header">
                <span>${formatDate(nota.fecha)}</span>
                <button onclick="eliminarNotaCliente(${index})" class="btn-icon">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="nota-cliente-content">${nota.contenido}</div>
        </div>
    `).join('');
}

function renderTareasCliente() {
    const container = document.getElementById('tareasClienteList');
    container.innerHTML = currentClienteTareas.map((tarea, index) => `
        <div class="tarea-cliente-item">
            <button class="tarea-cliente-check ${tarea.completada ? 'completed' : ''}" 
                    onclick="toggleTareaCliente(${index})">
                <i class="fas ${tarea.completada ? 'fa-check-circle' : 'fa-circle'}"></i>
            </button>
            <div class="tarea-cliente-content">
                <div class="tarea-cliente-titulo ${tarea.completada ? 'completed' : ''}">
                    ${tarea.texto}
                </div>
                <div class="tarea-cliente-meta">
                    <span class="prioridad-${tarea.prioridad || 'media'}">
                        <i class="fas fa-flag"></i> ${tarea.prioridad || 'media'}
                    </span>
                    ${tarea.fecha ? `<span><i class="fas fa-calendar"></i> ${formatDate(tarea.fecha)}</span>` : ''}
                </div>
            </div>
            <button onclick="eliminarTareaCliente(${index})" class="btn-icon">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function agregarNotaCliente() {
    const contenido = document.getElementById('nuevaNotaCliente').value.trim();
    if (contenido) {
        currentClienteNotas.push({
            contenido: contenido,
            fecha: new Date().toISOString()
        });
        document.getElementById('nuevaNotaCliente').value = '';
        renderNotasCliente();
    }
}

function agregarTareaCliente() {
    const texto = document.getElementById('nuevaTareaCliente').value.trim();
    if (texto) {
        currentClienteTareas.push({
            texto: texto,
            prioridad: document.getElementById('nuevaTareaPrioridad').value,
            fecha: document.getElementById('nuevaTareaFecha').value,
            completada: false
        });
        document.getElementById('nuevaTareaCliente').value = '';
        document.getElementById('nuevaTareaFecha').value = '';
        renderTareasCliente();
    }
}

function eliminarNotaCliente(index) {
    currentClienteNotas.splice(index, 1);
    renderNotasCliente();
}

function eliminarTareaCliente(index) {
    currentClienteTareas.splice(index, 1);
    renderTareasCliente();
}

function toggleTareaCliente(index) {
    currentClienteTareas[index].completada = !currentClienteTareas[index].completada;
    renderTareasCliente();
}

function saveCliente() {
    const clienteData = {
        nombre: document.getElementById('clienteNombre').value,
        rubro: document.getElementById('clienteRubro').value,
        estado: document.getElementById('clienteEstado').value,
        etiquetas: document.getElementById('clienteEtiquetas').value,
        email: document.getElementById('clienteEmail').value,
        telefono1: document.getElementById('clienteTelefono1').value,
        telefono2: document.getElementById('clienteTelefono2').value,
        whatsapp: document.getElementById('clienteWhatsapp').value,
        direccion: document.getElementById('clienteDireccion').value,
        instagram: document.getElementById('clienteInstagram').value,
        facebook: document.getElementById('clienteFacebook').value,
        proyecto: document.getElementById('clienteProyecto').value,
        costo: document.getElementById('clienteCosto').value,
        pago: document.getElementById('clientePago').value,
        metodoPago: document.getElementById('clienteMetodoPago').value,
        link: document.getElementById('clienteLink').value,
        fechaEntrega: document.getElementById('clienteFechaEntrega').value,
        observaciones: document.getElementById('clienteObservaciones').value,
        notas: currentClienteNotas,
        tareas: currentClienteTareas,
        fecha: new Date().toISOString()
    };

    const ref = database.ref('clientes');
    
    if (editingClienteId) {
        ref.child(editingClienteId).update(clienteData)
            .then(() => {
                showNotification('Cliente actualizado', 'success');
                closeAllModals();
            })
            .catch(() => {
                saveOfflineCliente(editingClienteId, clienteData);
            });
    } else {
        ref.push(clienteData)
            .then(() => {
                showNotification('Cliente creado', 'success');
                closeAllModals();
            })
            .catch(() => {
                saveOfflineCliente(null, clienteData);
            });
    }
}

function saveOfflineCliente(id, data) {
    if (id) {
        const index = offlineData.clientes.findIndex(c => c.id === id);
        if (index !== -1) {
            offlineData.clientes[index] = { ...offlineData.clientes[index], ...data, id, synced: false };
        }
    } else {
        const newId = 'offline_' + Date.now();
        offlineData.clientes.push({ ...data, id: newId, synced: false });
    }
    saveOfflineData();
    renderClientes(offlineData.clientes);
    showNotification('Guardado localmente', 'warning');
    closeAllModals();
}

function editarCliente(id) {
    openClienteModal(id);
}

function eliminarCliente(id) {
    if (confirm('¿Eliminar este cliente?')) {
        database.ref('clientes').child(id).remove()
            .catch(() => {
                offlineData.clientes = offlineData.clientes.filter(c => c.id !== id);
                saveOfflineData();
                renderClientes(offlineData.clientes);
            });
    }
}

function verDetalleCliente(id) {
    const cliente = offlineData.clientes.find(c => c.id === id);
    if (!cliente) return;
    
    editingClienteId = id;
    
    const modal = document.getElementById('detalleClienteModal');
    const body = document.getElementById('detalleClienteBody');
    
    body.innerHTML = `
        <div class="detalle-seccion">
            <h3>Información General</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="detalle-label">Nombre</span>
                    <span class="detalle-valor">${cliente.nombre || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Rubro</span>
                    <span class="detalle-valor">${cliente.rubro || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Estado</span>
                    <span class="detalle-valor badge ${cliente.estado}">${cliente.estado}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Etiquetas</span>
                    <span class="detalle-valor">${cliente.etiquetas || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="detalle-seccion">
            <h3>Contacto</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="detalle-label">Email</span>
                    <span class="detalle-valor">${cliente.email || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Teléfono 1</span>
                    <span class="detalle-valor">${cliente.telefono1 || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Teléfono 2</span>
                    <span class="detalle-valor">${cliente.telefono2 || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">WhatsApp</span>
                    <span class="detalle-valor">${cliente.whatsapp || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Dirección</span>
                    <span class="detalle-valor">${cliente.direccion || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="detalle-seccion">
            <h3>Proyecto</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="detalle-label">Tipo</span>
                    <span class="detalle-valor">${cliente.proyecto || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Costo</span>
                    <span class="detalle-valor">$${cliente.costo || 0}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Pago</span>
                    <span class="detalle-valor badge ${cliente.pago}">${cliente.pago}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Método</span>
                    <span class="detalle-valor">${cliente.metodoPago || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Link</span>
                    <span class="detalle-valor">${cliente.link ? `<a href="${cliente.link}" target="_blank">Ver proyecto</a>` : 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Fecha entrega</span>
                    <span class="detalle-valor">${cliente.fechaEntrega ? formatDate(cliente.fechaEntrega) : 'N/A'}</span>
                </div>
            </div>
            ${cliente.observaciones ? `
                <div style="margin-top: 15px;">
                    <span class="detalle-label">Observaciones</span>
                    <p>${cliente.observaciones}</p>
                </div>
            ` : ''}
        </div>
        
        <div class="detalle-seccion">
            <h3>Notas (${cliente.notas ? cliente.notas.length : 0})</h3>
            <div class="notas-list">
                ${cliente.notas && cliente.notas.length ? cliente.notas.map((n, idx) => `
                    <div class="nota-cliente-item">
                        <div class="nota-cliente-header">
                            <span>${formatDate(n.fecha)}</span>
                            <button onclick="eliminarNotaClienteDetalle('${cliente.id}', ${idx})" class="btn-delete" title="Eliminar nota">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="nota-cliente-content">${n.contenido}</div>
                    </div>
                `).join('') : '<p class="no-data">No hay notas</p>'}
            </div>
        </div>
        
        <div class="detalle-seccion">
            <h3>Tareas (${cliente.tareas ? cliente.tareas.filter(t => !t.completada).length : 0} pendientes)</h3>
            <div class="tareas-list">
                ${cliente.tareas && cliente.tareas.length ? cliente.tareas.map((t, idx) => `
                    <div class="tarea-cliente-item">
                        <button class="crm-check-toggle" style="background:none;border:none;padding:0;" onclick="toggleTareaClienteDetalle('${cliente.id}', ${idx})" title="Marcar ${t.completada ? 'pendiente' : 'completada'}">
                            <i class="fas ${t.completada ? 'fa-check-circle' : 'fa-circle'}" 
                               style="color: ${t.completada ? '#27ae60' : '#7f8c8d'}; font-size: 18px;"></i>
                        </button>
                        <div class="tarea-cliente-content">
                            <div class="tarea-cliente-titulo ${t.completada ? 'completed' : ''}" style="${t.completada ? 'text-decoration:line-through; opacity:.6;' : ''}">
                                ${t.texto}
                            </div>
                            <div class="tarea-cliente-meta">
                                <span class="prioridad-${t.prioridad || 'media'}">
                                    ${t.prioridad || 'media'}
                                </span>
                            </div>
                        </div>
                        <button onclick="eliminarTareaClienteDetalle('${cliente.id}', ${idx})" class="btn-delete" title="Eliminar tarea">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('') : '<p class="no-data">No hay tareas</p>'}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function toggleTareaClienteDetalle(clienteId, index) {
    const cliente = offlineData.clientes.find(c => c.id === clienteId);
    if (!cliente || !cliente.tareas || !cliente.tareas[index]) return;

    const tareasActualizadas = [...cliente.tareas];
    tareasActualizadas[index] = { ...tareasActualizadas[index], completada: !tareasActualizadas[index].completada };

    database.ref('clientes').child(clienteId).update({ tareas: tareasActualizadas })
        .then(() => {
            verDetalleCliente(clienteId);
        })
        .catch(() => {
            cliente.tareas = tareasActualizadas;
            cliente.synced = false;
            saveOfflineData();
            renderClientes(offlineData.clientes);
            updateDashboard();
            verDetalleCliente(clienteId);
        });
}

function eliminarTareaClienteDetalle(clienteId, index) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    const cliente = offlineData.clientes.find(c => c.id === clienteId);
    if (!cliente || !cliente.tareas) return;

    const tareasActualizadas = cliente.tareas.filter((_, i) => i !== index);

    database.ref('clientes').child(clienteId).update({ tareas: tareasActualizadas })
        .then(() => {
            verDetalleCliente(clienteId);
        })
        .catch(() => {
            cliente.tareas = tareasActualizadas;
            cliente.synced = false;
            saveOfflineData();
            renderClientes(offlineData.clientes);
            updateDashboard();
            verDetalleCliente(clienteId);
        });
}

function eliminarNotaClienteDetalle(clienteId, index) {
    if (!confirm('¿Eliminar esta nota?')) return;
    const cliente = offlineData.clientes.find(c => c.id === clienteId);
    if (!cliente || !cliente.notas) return;

    const notasActualizadas = cliente.notas.filter((_, i) => i !== index);

    database.ref('clientes').child(clienteId).update({ notas: notasActualizadas })
        .then(() => {
            verDetalleCliente(clienteId);
        })
        .catch(() => {
            cliente.notas = notasActualizadas;
            cliente.synced = false;
            saveOfflineData();
            renderClientes(offlineData.clientes);
            updateDashboard();
            verDetalleCliente(clienteId);
        });
}

// Notas Generales
function openNotaGeneralModal(id = null) {
    editingNotaGeneralId = id;
    document.getElementById('notaGeneralModalTitle').textContent = id ? 'Editar Nota General' : 'Nueva Nota General';
    
    if (id) {
        const nota = offlineData.notasGenerales.find(n => n.id === id);
        if (nota) {
            document.getElementById('notaGeneralTitulo').value = nota.titulo || '';
            document.getElementById('notaGeneralCategoria').value = nota.categoria || 'personal';
            document.getElementById('notaGeneralColor').value = nota.color || '#3498db';
            document.getElementById('notaGeneralContenido').value = nota.contenido || '';
            document.getElementById('notaGeneralEtiquetas').value = nota.etiquetas || '';
        }
    } else {
        document.getElementById('notaGeneralForm').reset();
    }
    
    document.getElementById('notaGeneralModal').classList.add('active');
}

function saveNotaGeneral() {
    const notaData = {
        titulo: document.getElementById('notaGeneralTitulo').value,
        categoria: document.getElementById('notaGeneralCategoria').value,
        color: document.getElementById('notaGeneralColor').value,
        contenido: document.getElementById('notaGeneralContenido').value,
        etiquetas: document.getElementById('notaGeneralEtiquetas').value,
        fecha: new Date().toISOString()
    };

    const ref = database.ref('notasGenerales');
    
    if (editingNotaGeneralId) {
        ref.child(editingNotaGeneralId).update(notaData)
            .then(() => {
                showNotification('Nota actualizada', 'success');
                closeAllModals();
            })
            .catch(() => {
                saveOfflineNotaGeneral(editingNotaGeneralId, notaData);
            });
    } else {
        ref.push(notaData)
            .then(() => {
                showNotification('Nota creada', 'success');
                closeAllModals();
            })
            .catch(() => {
                saveOfflineNotaGeneral(null, notaData);
            });
    }
}

function saveOfflineNotaGeneral(id, data) {
    if (id) {
        const index = offlineData.notasGenerales.findIndex(n => n.id === id);
        if (index !== -1) {
            offlineData.notasGenerales[index] = { ...offlineData.notasGenerales[index], ...data, id, synced: false };
        }
    } else {
        const newId = 'offline_' + Date.now();
        offlineData.notasGenerales.push({ ...data, id: newId, synced: false });
    }
    saveOfflineData();
    renderNotasGenerales(offlineData.notasGenerales);
    showNotification('Guardado localmente', 'warning');
    closeAllModals();
}

function editarNotaGeneral(id) {
    openNotaGeneralModal(id);
}

function eliminarNotaGeneral(id) {
    if (confirm('¿Eliminar esta nota?')) {
        database.ref('notasGenerales').child(id).remove()
            .catch(() => {
                offlineData.notasGenerales = offlineData.notasGenerales.filter(n => n.id !== id);
                saveOfflineData();
                renderNotasGenerales(offlineData.notasGenerales);
            });
    }
}

function verDetalleNotaGeneral(id) {
    const nota = offlineData.notasGenerales.find(n => n.id === id);
    if (!nota) return;

    const metaItems = [
        { icon: 'fa-clock', texto: formatDate(nota.fecha) }
    ];
    if (nota.etiquetas) {
        nota.etiquetas.split(',').forEach(e => {
            if (e.trim()) metaItems.push({ icon: 'fa-tag', texto: e.trim() });
        });
    }

    mostrarModalDetalle({
        titulo: nota.titulo || 'Sin título',
        badgeTexto: nota.categoria || 'general',
        badgeColor: nota.color,
        contenido: nota.contenido,
        metaItems,
        acciones: [
            { texto: 'Eliminar', icono: 'fa-trash', clase: 'btn-secondary', onclick: `cerrarModalDetalle(); eliminarNotaGeneral('${id}')` },
            { texto: 'Editar', icono: 'fa-edit', clase: 'btn-primary', onclick: `cerrarModalDetalle(); editarNotaGeneral('${id}')` }
        ]
    });
}

// Tareas Generales
function openTareaGeneralModal(id = null) {
    editingTareaGeneralId = id;
    document.getElementById('tareaGeneralModalTitle').textContent = id ? 'Editar Tarea General' : 'Nueva Tarea General';
    
    if (id) {
        const tarea = offlineData.tareasGenerales.find(t => t.id === id);
        if (tarea) {
            document.getElementById('tareaGeneralTitulo').value = tarea.titulo || '';
            document.getElementById('tareaGeneralPrioridad').value = tarea.prioridad || 'media';
            document.getElementById('tareaGeneralEstado').value = tarea.estado || 'pendiente';
            document.getElementById('tareaGeneralFechaLimite').value = tarea.fechaLimite || '';
            document.getElementById('tareaGeneralHora').value = tarea.hora || '';
            document.getElementById('tareaGeneralDescripcion').value = tarea.descripcion || '';
            document.getElementById('tareaGeneralEtiquetas').value = tarea.etiquetas || '';
        }
    } else {
        document.getElementById('tareaGeneralForm').reset();
    }
    
    document.getElementById('tareaGeneralModal').classList.add('active');
}

function saveTareaGeneral() {
    const tareaData = {
        titulo: document.getElementById('tareaGeneralTitulo').value,
        prioridad: document.getElementById('tareaGeneralPrioridad').value,
        estado: document.getElementById('tareaGeneralEstado').value,
        fechaLimite: document.getElementById('tareaGeneralFechaLimite').value,
        hora: document.getElementById('tareaGeneralHora').value,
        descripcion: document.getElementById('tareaGeneralDescripcion').value,
        etiquetas: document.getElementById('tareaGeneralEtiquetas').value,
        fecha: new Date().toISOString()
    };

    const ref = database.ref('tareasGenerales');
    
    if (editingTareaGeneralId) {
        ref.child(editingTareaGeneralId).update(tareaData)
            .then(() => {
                showNotification('Tarea actualizada', 'success');
                closeAllModals();
            })
            .catch(() => {
                saveOfflineTareaGeneral(editingTareaGeneralId, tareaData);
            });
    } else {
        ref.push(tareaData)
            .then(() => {
                showNotification('Tarea creada', 'success');
                closeAllModals();
            })
            .catch(() => {
                saveOfflineTareaGeneral(null, tareaData);
            });
    }
}

function saveOfflineTareaGeneral(id, data) {
    if (id) {
        const index = offlineData.tareasGenerales.findIndex(t => t.id === id);
        if (index !== -1) {
            offlineData.tareasGenerales[index] = { ...offlineData.tareasGenerales[index], ...data, id, synced: false };
        }
    } else {
        const newId = 'offline_' + Date.now();
        offlineData.tareasGenerales.push({ ...data, id: newId, synced: false });
    }
    saveOfflineData();
    renderTareasGenerales(offlineData.tareasGenerales);
    showNotification('Guardado localmente', 'warning');
    closeAllModals();
}

function editarTareaGeneral(id) {
    openTareaGeneralModal(id);
}

function eliminarTareaGeneral(id) {
    if (confirm('¿Eliminar esta tarea?')) {
        database.ref('tareasGenerales').child(id).remove()
            .catch(() => {
                offlineData.tareasGenerales = offlineData.tareasGenerales.filter(t => t.id !== id);
                saveOfflineData();
                renderTareasGenerales(offlineData.tareasGenerales);
            });
    }
}

function toggleTareaGeneral(id) {
    const tarea = offlineData.tareasGenerales.find(t => t.id === id);
    if (tarea) {
        const nuevoEstado = tarea.estado === 'completada' ? 'pendiente' : 'completada';
        database.ref('tareasGenerales').child(id).update({ estado: nuevoEstado })
            .catch(() => {
                tarea.estado = nuevoEstado;
                tarea.synced = false;
                saveOfflineData();
                renderTareasGenerales(offlineData.tareasGenerales);
            });
    }
}

function verDetalleTareaGeneral(id) {
    const tarea = offlineData.tareasGenerales.find(t => t.id === id);
    if (!tarea) return;

    const metaItems = [
        { icon: 'fa-flag', texto: `Prioridad: ${tarea.prioridad || 'media'}` },
        { icon: 'fa-info-circle', texto: `Estado: ${tarea.estado || 'pendiente'}` }
    ];
    if (tarea.fechaLimite) {
        metaItems.push({ icon: 'fa-calendar', texto: formatDate(tarea.fechaLimite) + (tarea.hora ? ` · ${tarea.hora}` : '') });
    }
    if (tarea.etiquetas) {
        tarea.etiquetas.split(',').forEach(e => {
            if (e.trim()) metaItems.push({ icon: 'fa-tag', texto: e.trim() });
        });
    }

    const estaCompletada = tarea.estado === 'completada';

    mostrarModalDetalle({
        titulo: tarea.titulo,
        badgeTexto: tarea.estado || 'pendiente',
        contenido: tarea.descripcion || 'Sin descripción',
        metaItems,
        acciones: [
            { texto: 'Eliminar', icono: 'fa-trash', clase: 'btn-secondary', onclick: `cerrarModalDetalle(); eliminarTareaGeneral('${id}')` },
            { texto: 'Editar', icono: 'fa-edit', clase: 'btn-secondary', onclick: `cerrarModalDetalle(); editarTareaGeneral('${id}')` },
            { texto: estaCompletada ? 'Marcar pendiente' : 'Marcar completada', icono: estaCompletada ? 'fa-undo' : 'fa-check', clase: 'btn-primary', onclick: `toggleTareaGeneral('${id}'); cerrarModalDetalle();` }
        ]
    });
}

// Filters
function filterClientes() {
    const rubro = document.getElementById('rubroFilter').value;
    const estado = document.getElementById('estadoFilter').value;
    const pago = document.getElementById('pagoFilter').value;
    
    const filtered = offlineData.clientes.filter(c => 
        (!rubro || c.rubro === rubro) &&
        (!estado || c.estado === estado) &&
        (!pago || c.pago === pago)
    );
    
    renderClientes(filtered);
}

function filterNotasGenerales() {
    const categoria = document.getElementById('categoriaFilter').value;
    
    const filtered = offlineData.notasGenerales.filter(n => 
        !categoria || n.categoria === categoria
    );
    
    renderNotasGenerales(filtered);
}

function filterTareasGenerales() {
    const prioridad = document.getElementById('prioridadFilter').value;
    const estado = document.getElementById('estadoTareaFilter').value;
    
    const filtered = offlineData.tareasGenerales.filter(t => 
        (!prioridad || t.prioridad === prioridad) &&
        (!estado || t.estado === estado)
    );
    
    renderTareasGenerales(filtered);
}

function updateRubroFilter(clientes) {
    const rubros = [...new Set(clientes.map(c => c.rubro).filter(Boolean))];
    const select = document.getElementById('rubroFilter');
    if (select) {
        select.innerHTML = '<option value="">Todos los rubros</option>' +
            rubros.map(r => `<option value="${r}">${r}</option>`).join('');
    }
}

// Search
function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    
    if (currentPage === 'clientes') {
        const filtered = offlineData.clientes.filter(c => 
            c.nombre?.toLowerCase().includes(term) ||
            c.rubro?.toLowerCase().includes(term) ||
            c.proyecto?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.telefono1?.includes(term)
        );
        renderClientes(filtered);
    } else if (currentPage === 'notas-generales') {
        const filtered = offlineData.notasGenerales.filter(n => 
            n.titulo?.toLowerCase().includes(term) ||
            n.contenido?.toLowerCase().includes(term) ||
            n.etiquetas?.toLowerCase().includes(term)
        );
        renderNotasGenerales(filtered);
    } else if (currentPage === 'tareas-generales') {
        const filtered = offlineData.tareasGenerales.filter(t => 
            t.titulo?.toLowerCase().includes(term) ||
            t.descripcion?.toLowerCase().includes(term) ||
            t.etiquetas?.toLowerCase().includes(term)
        );
        renderTareasGenerales(filtered);
    }
}

// Tab switching
function switchTab(e) {
    const tabId = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Utility
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    cerrarModalDetalle();
    editingClienteId = null;
    editingNotaGeneralId = null;
    editingTareaGeneralId = null;
}

function showNotification(message, type = 'info') {
    // Verificar si ya existe una función showToast
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 
                         'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: ${type === 'success' ? '#27ae60' : 
                           type === 'warning' ? '#f39c12' : 
                           '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const isFuture = date > now;
    
    // Si es una fecha futura (como fecha de entrega), mostrar formato normal
    if (isFuture) {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Para fechas pasadas (notas, tareas completadas), mostrar tiempo relativo
    if (diff < 60000) return 'hace un momento';
    if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} minutos`;
    if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)} horas`;
    if (diff < 604800000) return `hace ${Math.floor(diff / 86400000)} días`;
    
    // Para fechas más antiguas, mostrar fecha formateada
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================================
// Modal genérico de detalle (para notas y tareas generales)
// Se crea dinámicamente, no depende del HTML existente.
// ============================================================
function mostrarModalDetalle({ titulo, badgeTexto, badgeColor, contenido, metaItems = [], acciones = [] }) {
    let overlay = document.getElementById('crmDetailOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'crmDetailOverlay';
        overlay.className = 'crm-detail-overlay';
        overlay.innerHTML = `
            <div class="crm-detail-box">
                <div class="crm-detail-header">
                    <h3 id="crmDetailTitulo"></h3>
                    <button class="crm-detail-close" id="crmDetailCloseBtn"><i class="fas fa-times"></i></button>
                </div>
                <div id="crmDetailBadge" style="margin-bottom:10px;"></div>
                <div class="crm-detail-meta" id="crmDetailMeta"></div>
                <div class="crm-detail-content" id="crmDetailContenido"></div>
                <div class="crm-detail-actions" id="crmDetailAcciones"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cerrarModalDetalle();
        });
        document.getElementById('crmDetailCloseBtn').addEventListener('click', cerrarModalDetalle);
    }

    document.getElementById('crmDetailTitulo').textContent = titulo || 'Detalle';
    document.getElementById('crmDetailBadge').innerHTML = badgeTexto
        ? `<span class="badge" style="${badgeColor ? `background:${badgeColor};color:#fff;` : ''}">${badgeTexto}</span>`
        : '';
    document.getElementById('crmDetailMeta').innerHTML = metaItems
        .filter(Boolean)
        .map(m => `<span><i class="fas ${m.icon || 'fa-info-circle'}"></i> ${m.texto}</span>`)
        .join('');
    document.getElementById('crmDetailContenido').textContent = contenido || 'Sin contenido';
    document.getElementById('crmDetailAcciones').innerHTML = acciones
        .map(a => `<button class="${a.clase || 'btn-secondary'}" onclick="${a.onclick}">${a.icono ? `<i class="fas ${a.icono}"></i> ` : ''}${a.texto}</button>`)
        .join('');

    overlay.classList.add('show');
}

function cerrarModalDetalle() {
    const overlay = document.getElementById('crmDetailOverlay');
    if (overlay) overlay.classList.remove('show');
}

// Make functions global
window.editarCliente = editarCliente;
window.eliminarCliente = eliminarCliente;
window.verDetalleCliente = verDetalleCliente;
window.editarNotaGeneral = editarNotaGeneral;
window.eliminarNotaGeneral = eliminarNotaGeneral;
window.editarTareaGeneral = editarTareaGeneral;
window.eliminarTareaGeneral = eliminarTareaGeneral;
window.toggleTareaGeneral = toggleTareaGeneral;
window.agregarNotaCliente = agregarNotaCliente;
window.agregarTareaCliente = agregarTareaCliente;
window.eliminarNotaCliente = eliminarNotaCliente;
window.eliminarTareaCliente = eliminarTareaCliente;
window.toggleTareaCliente = toggleTareaCliente;
window.verDetalleNotaGeneral = verDetalleNotaGeneral;
window.verDetalleTareaGeneral = verDetalleTareaGeneral;
window.cerrarModalDetalle = cerrarModalDetalle;
window.toggleTareaClienteDetalle = toggleTareaClienteDetalle;
window.eliminarTareaClienteDetalle = eliminarTareaClienteDetalle;
window.eliminarNotaClienteDetalle = eliminarNotaClienteDetalle;