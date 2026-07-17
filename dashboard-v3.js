document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let appData = { servicios: [], lookbook: [], categorias: [] };
    let activeCategoryName = 'Todas';

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

    const saveStatus = document.getElementById('save-status');

    // Custom Confirm Modal
    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmCancelX = document.getElementById('confirm-cancel-x');

    // Custom Prompt Modal (for Categories)
    const promptOverlay = document.getElementById('prompt-overlay');
    const promptTitle = document.getElementById('prompt-title');
    const promptInput = document.getElementById('prompt-input');
    const promptOkBtn = document.getElementById('prompt-ok-btn');
    const promptCancelBtn = document.getElementById('prompt-cancel-btn');
    const promptCancelX = document.getElementById('prompt-cancel-x');

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

    // --- Custom Prompt ---
    let pendingPromptCallback = null;
    window.showPrompt = function(title, defaultValue, onConfirm) {
        promptTitle.textContent = title;
        promptInput.value = defaultValue || '';
        pendingPromptCallback = onConfirm;
        promptOverlay.classList.add('active');
        setTimeout(() => promptInput.focus(), 100);
    };
    function hidePrompt() {
        promptOverlay.classList.remove('active');
        pendingPromptCallback = null;
    }
    promptOkBtn.addEventListener('click', () => {
        const val = promptInput.value.trim();
        if (val && pendingPromptCallback) {
            pendingPromptCallback(val);
            hidePrompt();
        }
    });
    promptCancelBtn.addEventListener('click', hidePrompt);
    promptCancelX.addEventListener('click', hidePrompt);
    promptOverlay.addEventListener('click', (e) => { if (e.target === promptOverlay) hidePrompt(); });

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

                let cData = [];
                try {
                    const { data, error } = await supabaseClient.from('categorias').select('*').order('orden', { ascending: true });
                    if (!error) cData = data || [];
                } catch (e) {
                    console.warn('Categorias table fetch error, using fallback:', e);
                }

                // Si está vacío, migramos desde el local
                if (sData.length === 0 && lData.length === 0) {
                    console.log('Supabase vacío. Migrando desde Vercel/Local...');
                    const res = await fetch(API_URL);
                    if (res.ok) {
                        const localData = await res.json();
                        const sToInsert = (localData.servicios || []).map((s, i) => { const {id, ...rest} = s; return { ...rest, orden: i }; });
                        const lToInsert = (localData.lookbook || []).map((l, i) => { const {id, ...rest} = l; return { ...rest, orden: i }; });
                        const cToInsert = (localData.categorias || []).map((c, i) => { const {id, ...rest} = c; return { ...rest, orden: i }; });
                        if (sToInsert.length > 0) await supabaseClient.from('servicios').insert(sToInsert);
                        if (lToInsert.length > 0) await supabaseClient.from('lookbook').insert(lToInsert);
                        if (cToInsert.length > 0) {
                            try {
                                await supabaseClient.from('categorias').insert(cToInsert);
                            } catch (errCat) {
                                console.warn('Supabase categories insert failed:', errCat);
                            }
                        }
                        return fetchData(); // Re-fetch para obtener UUIDs
                    }
                }

                appData.servicios = sData || [];
                appData.lookbook = lData || [];
                appData.categorias = cData || [];

                // Si no hay categorías, las generamos dinámicamente de los servicios existentes
                if (appData.categorias.length === 0) {
                    const uniqueNames = [...new Set(appData.servicios.map(s => s.categoria || 'General'))];
                    appData.categorias = uniqueNames.map((name, i) => ({
                        id: `cat-${Date.now()}-${i}`,
                        nombre: name,
                        orden: i
                    }));
                }
            } catch (err) {
                console.error('Error Supabase fetch:', err);
                await fetchLocalFallback();
            }
        } else {
            await fetchLocalFallback();
        }
        
        renderCategorias();
        renderServicios();
        renderLookbook();
        populateLookbookServicesDropdown();
        if (typeof CitasModule !== 'undefined') CitasModule.serviciosList = appData.servicios;
    }

    async function fetchLocalFallback() {
        try {
            const res = await fetch(API_URL);
            if (res.ok) {
                appData = await res.json();
                if (!appData.categorias) appData.categorias = [];
                // Si no hay categorías, las generamos dinámicamente de los servicios existentes
                if (appData.categorias.length === 0) {
                    const uniqueNames = [...new Set((appData.servicios || []).map(s => s.categoria || 'General'))];
                    appData.categorias = uniqueNames.map((name, i) => ({
                        id: `cat-${Date.now()}-${i}`,
                        nombre: name,
                        orden: i
                    }));
                }
            }
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
                try {
                    await supabaseClient.from('categorias').delete().neq('nombre', '000');
                } catch (errDelCat) {
                    console.warn('Wiping categories from Supabase failed, probably no table:', errDelCat);
                }

                const sToInsert = appData.servicios.map((s, i) => { const {id, created_at, updated_at, ...rest} = s; return { ...rest, orden: i }; });
                const lToInsert = appData.lookbook.map((l, i) => { const {id, created_at, ...rest} = l; return { ...rest, orden: i }; });
                const cToInsert = appData.categorias.map((c, i) => { const {id, created_at, ...rest} = c; return { ...rest, orden: i }; });

                if (sToInsert.length > 0) await supabaseClient.from('servicios').insert(sToInsert);
                if (lToInsert.length > 0) await supabaseClient.from('lookbook').insert(lToInsert);
                if (cToInsert.length > 0) {
                    try {
                        await supabaseClient.from('categorias').insert(cToInsert);
                    } catch (errInsCat) {
                        console.warn('Inserting categories in Supabase failed:', errInsCat);
                    }
                }

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

    function populateServiciosCategorySelect() {
        const select = document.getElementById('servicio-categoria');
        if (!select) return;
        select.innerHTML = '';
        appData.categorias.forEach(cat => {
            select.innerHTML += `<option value="${cat.nombre}">${cat.nombre}</option>`;
        });
    }

    function renderCategorias() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;
        categoriesList.innerHTML = '';

        // Botón "Todas"
        const countAll = appData.servicios.length;
        const allLi = document.createElement('li');
        allLi.className = `category-item ${activeCategoryName === 'Todas' ? 'active' : ''}`;
        allLi.innerHTML = `
            <div class="category-info">
                <span class="category-name">Todas las categorías</span>
            </div>
            <span class="category-badge">${countAll}</span>
        `;
        allLi.addEventListener('click', () => {
            activeCategoryName = 'Todas';
            renderCategorias();
            renderServicios();
        });
        categoriesList.appendChild(allLi);

        // Renderizar cada categoría
        appData.categorias.forEach((cat, index) => {
            const countSvc = appData.servicios.filter(s => s.categoria === cat.nombre).length;
            const li = document.createElement('li');
            li.className = `category-item ${activeCategoryName === cat.nombre ? 'active' : ''}`;
            li.innerHTML = `
                <div class="category-info">
                    <span class="category-name">${cat.nombre}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="category-badge">${countSvc}</span>
                    <div class="category-actions">
                        <button class="category-action-btn edit-cat" data-index="${index}" title="Editar nombre">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="category-action-btn delete-cat" data-index="${index}" title="Eliminar categoría">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #dc3545;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `;
            li.addEventListener('click', (e) => {
                if (e.target.closest('.category-action-btn')) return; // No cambiar de vista si clicamos en acciones
                activeCategoryName = cat.nombre;
                renderCategorias();
                renderServicios();
            });
            categoriesList.appendChild(li);
        });

        // Eventos de editar y borrar categorías
        categoriesList.querySelectorAll('.edit-cat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const cat = appData.categorias[index];
                showPrompt('Editar Categoría', cat.nombre, (newName) => {
                    if (newName && newName !== cat.nombre) {
                        // Comprobar si ya existe una con ese nombre
                        if (appData.categorias.some(c => c.nombre.toLowerCase() === newName.toLowerCase())) {
                            alert('Ya existe una categoría con ese nombre.');
                            return;
                        }
                        const oldName = cat.nombre;
                        cat.nombre = newName;
                        // Actualizar servicios que tenían la categoría antigua
                        appData.servicios.forEach(s => {
                            if (s.categoria === oldName) s.categoria = newName;
                        });
                        if (activeCategoryName === oldName) activeCategoryName = newName;
                        renderCategorias();
                        renderServicios();
                        saveData();
                    }
                });
            });
        });

        categoriesList.querySelectorAll('.delete-cat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const cat = appData.categorias[index];
                showConfirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"? Esto también eliminará todos los servicios que pertenecen a ella.`, () => {
                    const deletedName = cat.nombre;
                    // Eliminar servicios
                    appData.servicios = appData.servicios.filter(s => s.categoria !== deletedName);
                    // Eliminar categoría
                    appData.categorias.splice(index, 1);
                    if (activeCategoryName === deletedName) {
                        activeCategoryName = 'Todas';
                    }
                    renderCategorias();
                    renderServicios();
                    saveData();
                });
            });
        });
    }

    // Evento Añadir Categoría
    const addCategoriaBtn = document.getElementById('add-categoria-btn');
    if (addCategoriaBtn) {
        addCategoriaBtn.addEventListener('click', () => {
            showPrompt('Nueva Categoría', '', (name) => {
                if (name) {
                    // Comprobar si ya existe
                    if (appData.categorias.some(c => c.nombre.toLowerCase() === name.toLowerCase())) {
                        alert('Ya existe una categoría con ese nombre.');
                        return;
                    }
                    appData.categorias.push({
                        id: `cat-${Date.now()}`,
                        nombre: name,
                        orden: appData.categorias.length
                    });
                    activeCategoryName = name; // Seleccionar la nueva categoría
                    renderCategorias();
                    renderServicios();
                    saveData();
                }
            });
        });
    }

    function renderServicios() {
        serviciosList.innerHTML = '';
        
        const activeTitle = document.getElementById('active-category-title');
        if (activeTitle) {
            activeTitle.textContent = activeCategoryName === 'Todas' ? 'Todos los servicios' : activeCategoryName;
        }

        // Filtrar servicios
        const filteredServices = activeCategoryName === 'Todas'
            ? appData.servicios
            : appData.servicios.filter(s => s.categoria === activeCategoryName);

        if (filteredServices.length === 0) {
            serviciosList.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem; width: 100%;">No hay servicios en esta categoría.</p>';
            return;
        }

        filteredServices.forEach((servicio) => {
            // Encontrar el índice original en appData.servicios
            const originalIndex = appData.servicios.findIndex(s => s.id === servicio.id);
            
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-info">
                    <h3>${servicio.titulo}</h3>
                    <p style="margin-bottom: 0.25rem;">
                        <span class="category-badge" style="background: rgba(212,175,55,0.1); color: var(--gold); border-color: rgba(212,175,55,0.3); margin-right: 0.5rem; font-size: 0.7rem;">${servicio.categoria || 'General'}</span>
                        <strong>${servicio.precio}</strong> | ${servicio.duracion}
                    </p>
                    <p><em>${(servicio.descripcion || '').substring(0, 80)}...</em></p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small edit-servicio" data-index="${originalIndex}">Editar</button>
                    <button class="btn btn-danger btn-small delete-servicio" data-index="${originalIndex}">Eliminar</button>
                </div>`;
            serviciosList.appendChild(card);
        });
    }

    addServicioBtn.addEventListener('click', () => {
        servicioForm.reset();
        document.getElementById('servicio-id').value = '';
        populateServiciosCategorySelect();
        if (activeCategoryName !== 'Todas') {
            document.getElementById('servicio-categoria').value = activeCategoryName;
        }
        document.getElementById('servicio-modal-title').textContent = 'Añadir Servicio';
        if (typeof UploadModule !== 'undefined') UploadModule.clearZone('servicio-upload-zone', 'servicio-previews');
        openModal('servicio-modal');
    });

    function editServicio(index) {
        const s = appData.servicios[index];
        document.getElementById('servicio-id').value = index;
        document.getElementById('servicio-titulo').value = s.titulo;
        populateServiciosCategorySelect();
        document.getElementById('servicio-categoria').value = s.categoria || 'General';
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
            categoria: document.getElementById('servicio-categoria').value,
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
        renderCategorias();
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

    function populateLookbookServicesDropdown() {
        const dropdown = document.getElementById('lookbook-servicio-id');
        if (!dropdown) return;
        dropdown.innerHTML = '<option value="">— Ninguno / Consulta General —</option>';
        appData.servicios.forEach(s => {
            const option = document.createElement('option');
            option.value = s.titulo;
            option.textContent = s.titulo;
            dropdown.appendChild(option);
        });
    }

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
                    <p><strong>Servicio:</strong> ${item.servicio_id || 'Ninguno'}</p>
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
        document.getElementById('lookbook-servicio-id').value = item.servicio_id || '';
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
            alt: document.getElementById('lookbook-alt').value,
            servicio_id: document.getElementById('lookbook-servicio-id').value
        };
        if (id === '') { appData.lookbook.push(newItem); }
        else { appData.lookbook[id] = newItem; }
        renderLookbook();
        closeModal();
        saveData();
    });
});
