document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let appData = {
        servicios: [],
        lookbook: []
    };

    // --- DOM Elements ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');
    const serviciosList = document.getElementById('servicios-list');
    const lookbookList = document.getElementById('lookbook-list');
    
    // Modals
    const modalOverlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('#modal-overlay .close-modal');
    
    // Forms
    const servicioForm = document.getElementById('servicio-form');
    const lookbookForm = document.getElementById('lookbook-form');
    
    // Buttons
    const addServicioBtn = document.getElementById('add-servicio-btn');
    const addLookbookBtn = document.getElementById('add-lookbook-btn');
    const saveAllBtn = document.getElementById('save-all-btn');
    const saveStatus = document.getElementById('save-status');

    // Custom Confirm Modal Elements
    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmCancelX = document.getElementById('confirm-cancel-x');

    // --- API URL ---
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api/data' 
        : '/api/data';

    // --- Init ---
    fetchData();

    // --- Custom Confirm Function ---
    let pendingConfirmCallback = null;

    function showConfirm(message, onConfirm) {
        confirmMessage.textContent = message;
        pendingConfirmCallback = onConfirm;
        confirmOverlay.classList.add('active');
    }

    function hideConfirm() {
        confirmOverlay.classList.remove('active');
        pendingConfirmCallback = null;
    }

    confirmOkBtn.addEventListener('click', () => {
        if (pendingConfirmCallback) {
            pendingConfirmCallback();
        }
        hideConfirm();
    });

    confirmCancelBtn.addEventListener('click', hideConfirm);
    confirmCancelX.addEventListener('click', hideConfirm);

    confirmOverlay.addEventListener('click', (e) => {
        if (e.target === confirmOverlay) hideConfirm();
    });

    // --- Navigation ---
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-view');
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            viewSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `view-${viewId}`) {
                    section.classList.add('active');
                }
            });
        });
    });

    // --- API Calls ---

    async function fetchData() {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                appData = await response.json();
                renderServicios();
                renderLookbook();
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Asegúrate de que el servidor Node.js esté corriendo (node server.js)');
        }
    }

    async function saveData() {
        saveStatus.textContent = 'Guardando...';
        saveStatus.className = 'status-msg';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appData)
            });
            
            if (response.ok) {
                saveStatus.textContent = 'Guardado exitosamente!';
                saveStatus.classList.add('status-success');
                setTimeout(() => { saveStatus.textContent = ''; }, 3000);
            } else {
                throw new Error('Failed to save data');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            saveStatus.textContent = 'Error al guardar.';
            saveStatus.classList.add('status-error');
        }
    }

    saveAllBtn.addEventListener('click', saveData);

    // --- Modals Logic ---
    function openModal(modalId) {
        modalOverlay.classList.add('active');
        document.getElementById(modalId).classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        modals.forEach(m => m.classList.remove('active'));
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // --- Servicios Logic (Event Delegation) ---
    serviciosList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-servicio');
        const editBtn = e.target.closest('.edit-servicio');

        if (deleteBtn) {
            const idx = parseInt(deleteBtn.dataset.index);
            showConfirm('¿Estás seguro de eliminar este servicio?', () => {
                appData.servicios.splice(idx, 1);
                renderServicios();
                saveData();
            });
        } else if (editBtn) {
            editServicio(editBtn.dataset.index);
        }
    });

    function renderServicios() {
        serviciosList.innerHTML = '';
        appData.servicios.forEach((servicio, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-info">
                    <h3>${servicio.titulo}</h3>
                    <p>${servicio.precio} | ${servicio.duracion}</p>
                    <p><em>${servicio.descripcion.substring(0, 80)}...</em></p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small edit-servicio" data-index="${index}">Editar</button>
                    <button class="btn btn-danger btn-small delete-servicio" data-index="${index}">Eliminar</button>
                </div>
            `;
            serviciosList.appendChild(card);
        });
    }

    addServicioBtn.addEventListener('click', () => {
        servicioForm.reset();
        document.getElementById('servicio-id').value = '';
        document.getElementById('servicio-modal-title').textContent = 'Añadir Servicio';
        openModal('servicio-modal');
    });

    function editServicio(index) {
        const servicio = appData.servicios[index];
        document.getElementById('servicio-id').value = index;
        document.getElementById('servicio-titulo').value = servicio.titulo;
        document.getElementById('servicio-descripcion').value = servicio.descripcion;
        document.getElementById('servicio-duracion').value = servicio.duracion;
        document.getElementById('servicio-precio').value = servicio.precio;
        document.getElementById('servicio-imagenes').value = servicio.imagenes.join(', ');
        document.getElementById('servicio-incluye').value = servicio.incluye.join('\n');
        
        document.getElementById('servicio-modal-title').textContent = 'Editar Servicio';
        openModal('servicio-modal');
    }

    servicioForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('servicio-id').value;
        const newServicio = {
            id: document.getElementById('servicio-titulo').value.toLowerCase().replace(/\s+/g, '-'),
            titulo: document.getElementById('servicio-titulo').value,
            descripcion: document.getElementById('servicio-descripcion').value,
            duracion: document.getElementById('servicio-duracion').value,
            precio: document.getElementById('servicio-precio').value,
            imagenes: document.getElementById('servicio-imagenes').value.split(',').map(s => s.trim()).filter(s => s),
            incluye: document.getElementById('servicio-incluye').value.split('\n').map(s => s.trim()).filter(s => s)
        };

        if (id === '') {
            appData.servicios.push(newServicio);
        } else {
            newServicio.id = appData.servicios[id].id;
            appData.servicios[id] = newServicio;
        }

        renderServicios();
        closeModal();
        saveData();
    });

    // --- Lookbook Logic (Event Delegation) ---
    lookbookList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-lookbook');
        const editBtn = e.target.closest('.edit-lookbook');

        if (deleteBtn) {
            const idx = parseInt(deleteBtn.dataset.index);
            showConfirm('¿Estás seguro de eliminar esta imagen del lookbook?', () => {
                appData.lookbook.splice(idx, 1);
                renderLookbook();
                saveData();
            });
        } else if (editBtn) {
            editLookbook(editBtn.dataset.index);
        }
    });

    function renderLookbook() {
        lookbookList.innerHTML = '';
        appData.lookbook.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'grid-item';
            card.innerHTML = `
                <img src="${item.imagen}" alt="${item.alt}">
                <div class="grid-item-info">
                    <p><strong>Cat:</strong> ${item.categoria}</p>
                    <p><strong>Alt:</strong> ${item.alt || '-'}</p>
                </div>
                <div class="item-actions" style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-small edit-lookbook" style="flex: 1;" data-index="${index}">Editar</button>
                    <button class="btn btn-danger btn-small delete-lookbook" style="flex: 1;" data-index="${index}">Eliminar</button>
                </div>
            `;
            lookbookList.appendChild(card);
        });
    }

    addLookbookBtn.addEventListener('click', () => {
        lookbookForm.reset();
        document.getElementById('lookbook-id').value = '';
        document.getElementById('lookbook-modal-title').textContent = 'Añadir Imagen Lookbook';
        openModal('lookbook-modal');
    });

    function editLookbook(index) {
        const item = appData.lookbook[index];
        document.getElementById('lookbook-id').value = index;
        document.getElementById('lookbook-imagen').value = item.imagen;
        document.getElementById('lookbook-categoria').value = item.categoria;
        document.getElementById('lookbook-alt').value = item.alt;
        
        document.getElementById('lookbook-modal-title').textContent = 'Editar Imagen Lookbook';
        openModal('lookbook-modal');
    }

    lookbookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('lookbook-id').value;
        const newItem = {
            id: id === '' ? `item${Date.now()}` : appData.lookbook[id].id,
            imagen: document.getElementById('lookbook-imagen').value,
            categoria: document.getElementById('lookbook-categoria').value,
            alt: document.getElementById('lookbook-alt').value
        };

        if (id === '') {
            appData.lookbook.push(newItem);
        } else {
            appData.lookbook[id] = newItem;
        }

        renderLookbook();
        closeModal();
        saveData();
    });

});
