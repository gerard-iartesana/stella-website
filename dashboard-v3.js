document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let appData = { servicios: [], lookbook: [] };

    // --- Init Supabase ---
    if (typeof initSupabase === 'function') initSupabase();

    // --- DOM Elements ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');
    const serviciosList = document.getElementById('servicios-list');
    const lookbookList = document.getElementById('lookbook-list');
    const modalOverlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('#modal-overlay .modal');
    const closeBtns = document.querySelectorAll('#modal-overlay .close-modal');
    const servicioForm = document.getElementById('servicio-form');
    const lookbookForm = document.getElementById('lookbook-form');
    const addServicioBtn = document.getElementById('add-servicio-btn');
    const addLookbookBtn = document.getElementById('add-lookbook-btn');
    const saveAllBtn = document.getElementById('save-all-btn');
    const saveStatus = document.getElementById('save-status');

    // Custom Confirm Modal
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

    // Init Mensajes & Citas modules
    if (typeof MensajesModule !== 'undefined') MensajesModule.init();
    if (typeof CitasModule !== 'undefined') CitasModule.init(appData.servicios);

    // Init Soporte module
    if (typeof SoporteModule !== 'undefined') {
        SoporteModule.init();
        // Botón "Nueva Incidencia"
        const addSoporteBtn = document.getElementById('add-soporte-btn');
        if (addSoporteBtn) addSoporteBtn.addEventListener('click', () => SoporteModule.openModal());
        // Cerrar modal soporte
        const closeSoporteModal = document.getElementById('close-soporte-modal');
        if (closeSoporteModal) closeSoporteModal.addEventListener('click', () => SoporteModule.closeModal());
        const soporteOverlay = document.getElementById('soporte-modal-overlay');
        if (soporteOverlay) soporteOverlay.addEventListener('click', (e) => { if (e.target === soporteOverlay) SoporteModule.closeModal(); });
    }

    // Init Upload Zones
    if (typeof UploadModule !== 'undefined') {
        UploadModule.setupZone('servicio-upload-zone', 'servicio-file-input', 'servicio-previews', 'servicio-upload-progress', 'servicio-progress-fill', 'servicio-progress-text', { multiple: true, folder: 'servicios' });
        UploadModule.setupZone('lookbook-upload-zone', 'lookbook-file-input', 'lookbook-previews', 'lookbook-upload-progress', 'lookbook-progress-fill', 'lookbook-progress-text', { multiple: false, folder: 'lookbook' });
    }

    // --- Custom Confirm ---
    let pendingConfirmCallback = null;
    window.showConfirm = function(message, onConfirm) {
        confirmMessage.textContent = message;
        pendingConfirmCallback = onConfirm;
        confirmOverlay.classList.add('active');
    };
    function hideConfirm() {
        confirmOverlay.classList.remove('active');
        pendingConfirmCallback = null;
    }
    confirmOkBtn.addEventListener('click', () => { if (pendingConfirmCallback) pendingConfirmCallback(); hideConfirm(); });
    confirmCancelBtn.addEventListener('click', hideConfirm);
    confirmCancelX.addEventListener('click', hideConfirm);
    confirmOverlay.addEventListener('click', (e) => { if (e.target === confirmOverlay) hideConfirm(); });

    // --- Navigation ---
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-view');
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            viewSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `view-${viewId}`) section.classList.add('active');
            });
        });
    });

    // --- API Calls ---
    async function fetchData() {
        if (typeof supabase !== 'undefined' && supabaseClient) {
            try {
                const { data: sData, error: sErr } = await supabaseClient.from('servicios').select('*').order('orden', { ascending: true });
                const { data: lData, error: lErr } = await supabaseClient.from('lookbook').select('*').order('orden', { ascending: true });
                if (sErr) throw sErr;

                // Si está vacío, migramos desde el local
                if (sData.length === 0 && lData.length === 0) {
                    console.log('Supabase vacío. Migrando desde Vercel/Local...');
                    const res = await fetch(API_URL);
                    if (res.ok) {
                        const localData = await res.json();
                        const sToInsert = (localData.servicios || []).map((s, i) => { const {id, ...rest} = s; return { ...rest, orden: i }; });
                        const lToInsert = (localData.lookbook || []).map((l, i) => { const {id, ...rest} = l; return { ...rest, orden: i }; });
                        if (sToInsert.length > 0) await supabaseClient.from('servicios').insert(sToInsert);
                        if (lToInsert.length > 0) await supabaseClient.from('lookbook').insert(lToInsert);
                        return fetchData(); // Re-fetch para obtener UUIDs
                    }
                }

                appData.servicios = sData || [];
                appData.lookbook = lData || [];
            } catch (err) {
                console.error('Error Supabase fetch:', err);
                await fetchLocalFallback();
            }
        } else {
            await fetchLocalFallback();
        }
        
        renderServicios();
        renderLookbook();
        if (typeof CitasModule !== 'undefined') CitasModule.serviciosList = appData.servicios;
    }

    async function fetchLocalFallback() {
        try {
            const res = await fetch(API_URL);
            if (res.ok) appData = await res.json();
        } catch (e) {
            console.error('Error fetch local:', e);
        }
    }

    async function saveData() {
        saveStatus.textContent = 'Guardando...';
        saveStatus.className = 'status-msg';

        if (typeof supabase !== 'undefined' && supabaseClient) {
            try {
                // Wipe and replace strategy (since arrays are small and Citas stores servicio as TEXT)
                await supabaseClient.from('servicios').delete().neq('titulo', '000'); // Hack para borrar todos
                await supabaseClient.from('lookbook').delete().neq('categoria', '000'); 

                const sToInsert = appData.servicios.map((s, i) => { const {id, created_at, updated_at, ...rest} = s; return { ...rest, orden: i }; });
                const lToInsert = appData.lookbook.map((l, i) => { const {id, created_at, ...rest} = l; return { ...rest, orden: i }; });

                if (sToInsert.length > 0) await supabaseClient.from('servicios').insert(sToInsert);
                if (lToInsert.length > 0) await supabaseClient.from('lookbook').insert(lToInsert);

                // Fetch new IDs
                await fetchData();
                saveStatus.textContent = '✓ Guardado (Supabase)';
                saveStatus.classList.add('status-success');
                setTimeout(() => { saveStatus.textContent = ''; }, 3000);
                return;
            } catch (err) {
                console.error('Error guardando en Supabase:', err);
            }
        }

        // Fallback a API_URL local/Redis
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appData)
            });
            if (response.ok) {
                saveStatus.textContent = '✓ Guardado (API)';
                saveStatus.classList.add('status-success');
                setTimeout(() => { saveStatus.textContent = ''; }, 3000);
            } else { throw new Error('Failed to save via API'); }
        } catch (error) {
            console.error('Error saving data:', error);
            saveStatus.textContent = 'Error al guardar';
            saveStatus.classList.add('status-error');
        }
    }
    saveAllBtn.addEventListener('click', saveData);

    // --- Modal Logic ---
    function openModal(modalId) {
        modalOverlay.classList.add('active');
        document.getElementById(modalId).classList.add('active');
    }
    function closeModal() {
        modalOverlay.classList.remove('active');
        modals.forEach(m => m.classList.remove('active'));
    }
    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    // --- Servicios Logic ---
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
        } else if (editBtn) { editServicio(editBtn.dataset.index); }
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
                </div>`;
            serviciosList.appendChild(card);
        });
    }

    addServicioBtn.addEventListener('click', () => {
        servicioForm.reset();
        document.getElementById('servicio-id').value = '';
        document.getElementById('servicio-modal-title').textContent = 'Añadir Servicio';
        if (typeof UploadModule !== 'undefined') UploadModule.clearZone('servicio-upload-zone', 'servicio-previews');
        openModal('servicio-modal');
    });

    function editServicio(index) {
        const s = appData.servicios[index];
        document.getElementById('servicio-id').value = index;
        document.getElementById('servicio-titulo').value = s.titulo;
        document.getElementById('servicio-descripcion').value = s.descripcion;
        document.getElementById('servicio-duracion').value = s.duracion;
        document.getElementById('servicio-precio').value = s.precio;
        document.getElementById('servicio-duracion-minutos').value = s.duracion_minutos || '';
        document.getElementById('servicio-imagenes').value = s.imagenes.join(', ');
        document.getElementById('servicio-incluye').value = s.incluye.join('\n');
        if (typeof UploadModule !== 'undefined') UploadModule.setUrls('servicio-upload-zone', 'servicio-previews', s.imagenes || []);
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
            duracion_minutos: parseInt(document.getElementById('servicio-duracion-minutos').value) || null,
            imagenes: (typeof UploadModule !== 'undefined' && UploadModule.getUrls('servicio-upload-zone').length > 0)
                ? UploadModule.getUrls('servicio-upload-zone')
                : document.getElementById('servicio-imagenes').value.split(',').map(s => s.trim()).filter(s => s),
            incluye: document.getElementById('servicio-incluye').value.split('\n').map(s => s.trim()).filter(s => s)
        };
        if (id === '') { appData.servicios.push(newServicio); }
        else { newServicio.id = appData.servicios[id].id; appData.servicios[id] = newServicio; }
        renderServicios();
        closeModal();
        saveData();
    });

    // --- Lookbook Logic ---
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
        } else if (editBtn) { editLookbook(editBtn.dataset.index); }
    });

    function renderLookbook() {
        lookbookList.innerHTML = '';
        const reversed = [...appData.lookbook].reverse();
        reversed.forEach((item) => {
            const index = appData.lookbook.indexOf(item);
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
                </div>`;
            lookbookList.appendChild(card);
        });
    }

    addLookbookBtn.addEventListener('click', () => {
        lookbookForm.reset();
        document.getElementById('lookbook-id').value = '';
        document.getElementById('lookbook-modal-title').textContent = 'Añadir Imagen Lookbook';
        if (typeof UploadModule !== 'undefined') UploadModule.clearZone('lookbook-upload-zone', 'lookbook-previews');
        openModal('lookbook-modal');
    });

    function editLookbook(index) {
        const item = appData.lookbook[index];
        document.getElementById('lookbook-id').value = index;
        document.getElementById('lookbook-imagen').value = item.imagen;
        document.getElementById('lookbook-categoria').value = item.categoria;
        document.getElementById('lookbook-alt').value = item.alt;
        if (typeof UploadModule !== 'undefined') UploadModule.setUrls('lookbook-upload-zone', 'lookbook-previews', item.imagen ? [item.imagen] : []);
        document.getElementById('lookbook-modal-title').textContent = 'Editar Imagen Lookbook';
        openModal('lookbook-modal');
    }

    lookbookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('lookbook-id').value;
        const newItem = {
            id: id === '' ? `item${Date.now()}` : appData.lookbook[id].id,
            imagen: (typeof UploadModule !== 'undefined' && UploadModule.getUrls('lookbook-upload-zone').length > 0)
                ? UploadModule.getUrls('lookbook-upload-zone')[0]
                : document.getElementById('lookbook-imagen').value,
            categoria: document.getElementById('lookbook-categoria').value,
            alt: document.getElementById('lookbook-alt').value
        };
        if (id === '') { appData.lookbook.push(newItem); }
        else { appData.lookbook[id] = newItem; }
        renderLookbook();
        closeModal();
        saveData();
    });
});
