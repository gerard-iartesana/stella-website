// ============================================
// Mensajes & Citas Module — Roots CMS
// ============================================

// Helpers de fecha en zona horaria local
function formatDateLocal(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateLocal(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

const MensajesModule = {
    mensajes: [],
    currentMsgIndex: null,
    filterMode: 'todos',

    init() {
        this.bindEvents();
        this.loadDemoData();
    },

    bindEvents() {
        const filterTodos = document.getElementById('filter-todos');
        const filterNoLeidos = document.getElementById('filter-no-leidos');
        const closeModal = document.getElementById('close-mensaje-modal');
        const replyBtn = document.getElementById('msg-reply-btn');
        const deleteBtn = document.getElementById('msg-delete-btn');
        const overlay = document.getElementById('mensaje-modal-overlay');

        if (filterTodos) filterTodos.addEventListener('click', () => { this.filterMode = 'todos'; this.updateFilterBtns(); this.render(); });
        if (filterNoLeidos) filterNoLeidos.addEventListener('click', () => { this.filterMode = 'no-leidos'; this.updateFilterBtns(); this.render(); });
        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
        if (replyBtn) replyBtn.addEventListener('click', () => this.saveReply());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteCurrent());

        const list = document.getElementById('mensajes-list');
        if (list) list.addEventListener('click', (e) => {
            const card = e.target.closest('.mensaje-card');
            if (card) this.openMessage(parseInt(card.dataset.index));
        });
    },

    updateFilterBtns() {
        document.getElementById('filter-todos').classList.toggle('active', this.filterMode === 'todos');
        document.getElementById('filter-no-leidos').classList.toggle('active', this.filterMode === 'no-leidos');
    },

    loadDemoData() {
        if (isSupabaseConfigured && isSupabaseConfigured()) return this.loadFromSupabase();
        this.mensajes = [
            { id: 1, nombre: 'María García', email: 'maria@email.com', telefono: '612345678', asunto: 'Consulta trenzas', mensaje: 'Hola, me gustaría saber disponibilidad para unas trenzas box braids la próxima semana. ¿Qué precios manejan?', leido: false, respondido: false, respuesta: '', created_at: '2026-05-18T10:30:00Z' },
            { id: 2, nombre: 'Laura Pérez', email: 'laura@email.com', telefono: '698765432', asunto: 'Alopecia consulta', mensaje: 'Buenas tardes, tengo problemas de alopecia y me gustaría una consulta privada. ¿Es posible?', leido: true, respondido: true, respuesta: 'Le confirmé cita para el jueves 22 a las 10:00.', created_at: '2026-05-17T15:00:00Z' },
            { id: 3, nombre: 'Ana Rodríguez', email: 'ana@email.com', telefono: '', asunto: 'Evento especial', mensaje: 'Hola! Me caso en julio y necesito un peinado especial con trenzas. ¿Hacen servicios para novias?', leido: false, respondido: false, respuesta: '', created_at: '2026-05-19T08:15:00Z' }
        ];
        this.render();
        this.updateBadge();
    },

    async loadFromSupabase() {
        try {
            const { data, error } = await supabaseClient.from('mensajes').select('*').order('created_at', { ascending: false });
            if (!error && data) { this.mensajes = data; this.render(); this.updateBadge(); }
        } catch (e) { console.error('Error loading mensajes:', e); }
    },

    render() {
        const list = document.getElementById('mensajes-list');
        const empty = document.getElementById('mensajes-empty');
        let filtered = this.filterMode === 'no-leidos' ? this.mensajes.filter(m => !m.leido) : this.mensajes;

        if (filtered.length === 0) {
            list.innerHTML = '';
            if (empty) { empty.style.display = 'block'; list.appendChild(empty); }
            return;
        }
        if (empty) empty.style.display = 'none';

        list.innerHTML = filtered.map((m, i) => {
            const realIdx = this.mensajes.indexOf(m);
            const fecha = new Date(m.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            return `<div class="mensaje-card ${m.leido ? '' : 'no-leido'}" data-index="${realIdx}">
                <span class="msg-indicator ${m.leido ? 'read' : 'unread'}"></span>
                <div class="msg-body">
                    <div class="msg-header-row"><span class="msg-nombre">${m.nombre}</span><span class="msg-fecha">${fecha}</span></div>
                    <div class="msg-asunto">${m.asunto || 'Sin asunto'}</div>
                    <div class="msg-preview">${m.mensaje.substring(0, 80)}...</div>
                    <div class="msg-tags">${m.respondido ? '<span class="msg-tag respondido">Respondido</span>' : (m.leido ? '<span class="msg-tag leido" style="background:#e0f2fe;color:#0284c7;">Leído</span>' : '<span class="msg-tag pendiente">Nuevo</span>')}</div>
                </div>
            </div>`;
        }).join('');
    },

    updateBadge() {
        const badge = document.getElementById('mensajes-badge');
        const count = this.mensajes.filter(m => !m.leido).length;
        if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-block' : 'none'; }
    },

    async openMessage(idx) {
        this.currentMsgIndex = idx;
        const m = this.mensajes[idx];
        if (!m) return;

        if (!m.leido) {
            m.leido = true;
            if (m.id && typeof supabaseClient !== 'undefined' && supabaseClient) {
                await supabaseClient.from('mensajes').update({ leido: true }).eq('id', m.id);
            }
        }
        this.render();
        this.updateBadge();

        document.getElementById('msg-detail-nombre').textContent = m.nombre;
        document.getElementById('msg-detail-email').textContent = m.email || '—';
        document.getElementById('msg-detail-telefono').textContent = m.telefono || '—';
        document.getElementById('msg-detail-asunto').textContent = m.asunto || 'Sin asunto';
        document.getElementById('msg-detail-fecha').textContent = new Date(m.created_at).toLocaleString('es-ES');
        document.getElementById('msg-detail-mensaje').textContent = m.mensaje;

        const respBox = document.getElementById('msg-respuesta-box');
        if (m.respondido && m.respuesta) {
            document.getElementById('msg-detail-respuesta').textContent = m.respuesta;
            respBox.style.display = 'block';
        } else { respBox.style.display = 'none'; }

        document.getElementById('msg-respuesta-input').value = m.respuesta || '';
        document.getElementById('mensaje-modal-overlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('mensaje-modal-overlay').classList.remove('active');
        this.currentMsgIndex = null;
    },

    async saveReply() {
        if (this.currentMsgIndex === null) return;
        const input = document.getElementById('msg-respuesta-input');
        const m = this.mensajes[this.currentMsgIndex];
        m.respuesta = input.value;
        m.respondido = input.value.trim().length > 0;
        
        if (m.id && typeof supabaseClient !== 'undefined' && supabaseClient) {
            await supabaseClient.from('mensajes').update({ respuesta: m.respuesta, respondido: m.respondido }).eq('id', m.id);
        }
        
        this.render();
        this.closeModal();
    },

    deleteCurrent() {
        if (this.currentMsgIndex === null) return;
        
        const deleteAction = async () => {
            const m = this.mensajes[this.currentMsgIndex];
            if (m.id && typeof supabaseClient !== 'undefined' && supabaseClient) {
                await supabaseClient.from('mensajes').delete().eq('id', m.id);
            }
            this.mensajes.splice(this.currentMsgIndex, 1);
            this.currentMsgIndex = null;
            this.render();
            this.updateBadge();
            this.closeModal();
        };

        if (typeof window.showConfirm !== 'undefined') {
            window.showConfirm('¿Estás seguro de que quieres eliminar este mensaje?', deleteAction);
        } else if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
            deleteAction();
        }
    }
};

// ============================================
const CitasModule = {
    citas: [],
    currentDate: null,
    currentView: 'mes', // 'mes', 'semana', 'dia'
    currentCitaId: null,

    init(serviciosList) {
        this.serviciosList = serviciosList || [];
        this.currentDate = new Date();
        this.bindEvents();
        
        // Sincronizar botón de vista activo al inicializar
        const viewMap = { 'mes': 'month', 'semana': 'week', 'dia': 'day' };
        const activeBtn = document.getElementById(`view-mode-${viewMap[this.currentView]}`);
        if (activeBtn) {
            ['month', 'week', 'day'].forEach(v => document.getElementById(`view-mode-${v}`)?.classList.remove('active'));
            activeBtn.classList.add('active');
        }

        this.loadDemoData();
    },

    getMonday(d) { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); },

    bindEvents() {
        document.getElementById('cal-prev')?.addEventListener('click', () => { 
            if (this.currentView === 'mes') this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            else if (this.currentView === 'semana') this.currentDate.setDate(this.currentDate.getDate() - 7);
            else if (this.currentView === 'dia') this.currentDate.setDate(this.currentDate.getDate() - 1);
            this.renderCalendar(); 
        });
        document.getElementById('cal-next')?.addEventListener('click', () => { 
            if (this.currentView === 'mes') this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            else if (this.currentView === 'semana') this.currentDate.setDate(this.currentDate.getDate() + 7);
            else if (this.currentView === 'dia') this.currentDate.setDate(this.currentDate.getDate() + 1);
            this.renderCalendar(); 
        });
        document.getElementById('cal-today')?.addEventListener('click', () => { 
            this.currentDate = new Date(); 
            this.renderCalendar(); 
        });

        // View Toggles
        const viewBtns = ['month', 'week', 'day'];
        viewBtns.forEach(view => {
            document.getElementById(`view-mode-${view}`)?.addEventListener('click', (e) => {
                viewBtns.forEach(v => document.getElementById(`view-mode-${v}`)?.classList.remove('active'));
                e.target.classList.add('active');
                if (view === 'month') this.currentView = 'mes';
                else if (view === 'week') this.currentView = 'semana';
                else if (view === 'day') this.currentView = 'dia';
                this.renderCalendar();
            });
        });

        document.getElementById('add-cita-btn')?.addEventListener('click', () => this.openCitaModal());
        document.getElementById('close-cita-modal')?.addEventListener('click', () => this.closeCitaModal());
        document.getElementById('cita-modal-overlay')?.addEventListener('click', (e) => { if (e.target.id === 'cita-modal-overlay') this.closeCitaModal(); });
        document.getElementById('close-day-detail')?.addEventListener('click', () => { document.getElementById('citas-day-detail').style.display = 'none'; });
        document.getElementById('cita-delete-btn')?.addEventListener('click', () => this.deleteCita());
        document.getElementById('cita-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveCita(); });
    },

    loadDemoData() {
        if (isSupabaseConfigured && isSupabaseConfigured()) return this.loadFromSupabase();
        const today = new Date();
        const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return formatDateLocal(dt); };
        this.citas = [
            { id: '1', nombre_cliente: 'María García', servicio: 'Box Braids', fecha: d(0), hora_inicio: '10:00', hora_fin: '13:00', estado: 'confirmada', notas: 'Primera visita', email: '', telefono: '612345678' },
            { id: '2', nombre_cliente: 'Ana López', servicio: 'Cornrows', fecha: d(1), hora_inicio: '09:30', hora_fin: '11:00', estado: 'pendiente', notas: '', email: 'ana@email.com', telefono: '' },
            { id: '3', nombre_cliente: 'Laura Pérez', servicio: 'Consulta alopecia', fecha: d(2), hora_inicio: '16:00', hora_fin: '17:00', estado: 'pendiente', notas: 'Revisar historial', email: '', telefono: '' },
            { id: '4', nombre_cliente: 'Carmen Ruiz', servicio: 'Twist', fecha: d(-1), hora_inicio: '11:00', hora_fin: '14:00', estado: 'completada', notas: '', email: '', telefono: '' }
        ];
        this.renderCalendar();
        this.updateBadge();
    },

    async loadFromSupabase() {
        try {
            const { data, error } = await supabaseClient.from('citas').select('*').order('fecha', { ascending: true });
            if (!error && data) { this.citas = data; this.renderCalendar(); this.updateBadge(); }
        } catch (e) { console.error('Error loading citas:', e); }
    },

    updateBadge() {
        const badge = document.getElementById('citas-badge');
        const count = this.citas.filter(c => c.estado === 'pendiente').length;
        if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-block' : 'none'; }
    },

    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;
        
        // Remove old classes
        grid.classList.remove('month-view', 'day-view', 'week-view');

        if (this.currentView === 'mes') {
            grid.classList.add('month-view');
            this.renderMonthView(grid);
        } else if (this.currentView === 'semana') {
            grid.classList.add('week-view');
            this.renderWeekView(grid);
        } else if (this.currentView === 'dia') {
            grid.classList.add('day-view');
            this.renderDayView(grid);
        }
    },

    renderMonthView(grid) {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const title = document.getElementById('cal-current-week');
        if (title) title.textContent = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        let html = days.map(d => `<div class="cal-day-header">${d}</div>`).join('');

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0

        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startOffset);

        const todayStr = formatDateLocal(new Date());

        // Rellenar 35 o 42 días
        const totalDays = startOffset + lastDay.getDate() > 35 ? 42 : 35;

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = formatDateLocal(date);
            const isToday = dateStr === todayStr;
            const isOtherMonth = date.getMonth() !== month;
            const dayCitas = this.citas.filter(c => c.fecha === dateStr).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

            html += `<div class="cal-day ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}" data-date="${dateStr}">
                <div class="cal-day-number">${date.getDate()}</div>
                ${dayCitas.slice(0, 2).map(c => `<div class="cal-event ${c.estado}" title="${c.nombre_cliente}">${c.hora_inicio} ${c.nombre_cliente}</div>`).join('')}
                ${dayCitas.length > 2 ? `<div style="font-size:0.7rem;color:var(--text-muted);text-align:center;">+${dayCitas.length - 2}</div>` : ''}
            </div>`;
        }
        grid.innerHTML = html;

        grid.querySelectorAll('.cal-day').forEach(day => {
            day.addEventListener('click', () => {
                this.currentDate = parseDateLocal(day.dataset.date);
                this.currentView = 'dia';
                document.getElementById('view-mode-month').classList.remove('active');
                document.getElementById('view-mode-day').classList.add('active');
                this.renderCalendar();
            });
        });
    },

    renderWeekView(grid) {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const today = formatDateLocal(new Date());
        const ws = this.getMonday(new Date(this.currentDate));

        // Update title
        const endWeek = new Date(ws); endWeek.setDate(endWeek.getDate() + 6);
        const title = document.getElementById('cal-current-week');
        if (title) title.textContent = `${ws.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${endWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

        let html = days.map(d => `<div class="cal-day-header">${d}</div>`).join('');

        for (let i = 0; i < 7; i++) {
            const date = new Date(ws);
            date.setDate(date.getDate() + i);
            const dateStr = formatDateLocal(date);
            const isToday = dateStr === today;
            const dayCitas = this.citas.filter(c => c.fecha === dateStr).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

            html += `<div class="cal-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="cal-day-number">${date.getDate()}</div>
                ${dayCitas.slice(0, 3).map(c => `<div class="cal-event ${c.estado}" title="${c.nombre_cliente}">${c.hora_inicio} ${c.nombre_cliente}</div>`).join('')}
                ${dayCitas.length > 3 ? `<div style="font-size:0.7rem;color:var(--text-muted);">+${dayCitas.length - 3} más</div>` : ''}
            </div>`;
        }
        grid.innerHTML = html;

        grid.querySelectorAll('.cal-day').forEach(day => {
            day.addEventListener('click', () => this.showDayDetail(day.dataset.date));
        });
    },

    renderDayView(grid) {
        const dateStr = formatDateLocal(this.currentDate);
        const title = document.getElementById('cal-current-week');
        if (title) title.textContent = this.currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const dayCitas = this.citas.filter(c => c.fecha === dateStr).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

        if (dayCitas.length === 0) {
            grid.innerHTML = `<div class="cal-day" style="text-align: center; color: var(--text-muted); padding: 3rem;">No hay citas para este día.</div>`;
            return;
        }

        let html = `<div class="cal-day">`;
        dayCitas.forEach(c => {
            html += `<div class="cal-event ${c.estado}" data-id="${c.id}">
                <div><strong>${c.hora_inicio}${c.hora_fin ? ' - ' + c.hora_fin : ''}</strong> &nbsp;|&nbsp; ${c.nombre_cliente} &nbsp; <span style="opacity:0.7;">(${c.servicio || 'Sin servicio'})</span></div>
                <span class="cita-status ${c.estado}">${c.estado}</span>
            </div>`;
        });
        html += `</div>`;
        grid.innerHTML = html;

        grid.querySelectorAll('.cal-event').forEach(el => {
            el.addEventListener('click', () => this.openCitaModal(el.dataset.id));
        });
    },

    showDayDetail(dateStr) {
        const panel = document.getElementById('citas-day-detail');
        const list = document.getElementById('citas-day-list');
        const title = document.getElementById('detail-day-title');
        const dayCitas = this.citas.filter(c => c.fecha === dateStr).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

        title.textContent = `Citas del ${parseDateLocal(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;

        if (dayCitas.length === 0) {
            list.innerHTML = '<div class="empty-state" style="padding:2rem;"><p>Sin citas este día</p></div>';
        } else {
            list.innerHTML = dayCitas.map(c => `<div class="cita-card" data-id="${c.id}" style="cursor:pointer;">
                <span class="cita-time">${c.hora_inicio}${c.hora_fin ? ' - ' + c.hora_fin : ''}</span>
                <div class="cita-info"><h4>${c.nombre_cliente}</h4><p>${c.servicio || 'Sin servicio'}</p></div>
                <span class="cita-status ${c.estado}">${c.estado}</span>
            </div>`).join('');

            list.querySelectorAll('.cita-card').forEach(card => {
                card.addEventListener('click', () => this.openCitaModal(card.dataset.id));
            });
        }
        panel.style.display = 'block';
    },

    openCitaModal(id) {
        const form = document.getElementById('cita-form');
        form.reset();
        const deleteBtn = document.getElementById('cita-delete-btn');

        if (id) {
            const c = this.citas.find(ci => ci.id === id);
            if (!c) return;
            this.currentCitaId = id;
            document.getElementById('cita-modal-title').textContent = 'Editar Cita';
            document.getElementById('cita-id').value = id;
            document.getElementById('cita-nombre').value = c.nombre_cliente;
            document.getElementById('cita-email').value = c.email || '';
            document.getElementById('cita-telefono').value = c.telefono || '';
            document.getElementById('cita-fecha').value = c.fecha;
            document.getElementById('cita-hora-inicio').value = c.hora_inicio;
            document.getElementById('cita-hora-fin').value = c.hora_fin || '';
            document.getElementById('cita-estado').value = c.estado;
            document.getElementById('cita-notas').value = c.notas || '';
            deleteBtn.style.display = 'block';

            const fotoContainer = document.getElementById('cita-foto-container');
            const fotoPreview = document.getElementById('cita-foto-preview');
            const fotoLink = document.getElementById('cita-foto-link');
            if (c.foto_url) {
                fotoPreview.src = c.foto_url;
                fotoLink.href = c.foto_url;
                fotoContainer.style.display = 'block';
            } else {
                fotoContainer.style.display = 'none';
                fotoPreview.src = '';
                fotoLink.href = '#';
            }
        } else {
            this.currentCitaId = null;
            document.getElementById('cita-modal-title').textContent = 'Nueva Cita';
            document.getElementById('cita-id').value = '';
            document.getElementById('cita-fecha').value = formatDateLocal(new Date());
            deleteBtn.style.display = 'none';
            document.getElementById('cita-foto-container').style.display = 'none';
        }

        this.populateServiciosSelect();
        document.getElementById('cita-modal-overlay').classList.add('active');
    },

    populateServiciosSelect() {
        const select = document.getElementById('cita-servicio');
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">— Seleccionar servicio —</option>';
        if (this.serviciosList) {
            // Agrupar por categoría
            const grouped = {};
            this.serviciosList.forEach(s => {
                const cat = s.categoria || 'General';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(s);
            });
            for (const catName in grouped) {
                let optgroup = `<optgroup label="${catName}">`;
                grouped[catName].forEach(s => {
                    optgroup += `<option value="${s.titulo}">${s.titulo}</option>`;
                });
                optgroup += `</optgroup>`;
                select.innerHTML += optgroup;
            }
        }
        if (current) select.value = current;
    },

    closeCitaModal() {
        document.getElementById('cita-modal-overlay').classList.remove('active');
        this.currentCitaId = null;
    },

    async saveCita() {
        const id = document.getElementById('cita-id').value;
        const isNew = !id;
        
        const citaData = {
            nombre_cliente: document.getElementById('cita-nombre').value,
            email: document.getElementById('cita-email').value,
            telefono: document.getElementById('cita-telefono').value,
            servicio: document.getElementById('cita-servicio').value,
            fecha: document.getElementById('cita-fecha').value,
            hora_inicio: document.getElementById('cita-hora-inicio').value,
            hora_fin: document.getElementById('cita-hora-fin').value || null,
            estado: document.getElementById('cita-estado').value,
            notas: document.getElementById('cita-notas').value
        };

        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            if (isNew) {
                const { data, error } = await supabaseClient.from('citas').insert([citaData]).select();
                if (!error && data && data.length > 0) {
                    this.citas.push(data[0]);
                } else {
                    console.error('Error creating cita:', error);
                    citaData.id = `cita-${Date.now()}`;
                    this.citas.push(citaData);
                }
            } else {
                const { error } = await supabaseClient.from('citas').update(citaData).eq('id', id);
                if (error) console.error('Error updating cita:', error);
                
                const idx = this.citas.findIndex(c => String(c.id) === String(id));
                if (idx >= 0) this.citas[idx] = { ...this.citas[idx], ...citaData };
            }
        } else {
            citaData.id = id || `cita-${Date.now()}`;
            if (isNew) {
                this.citas.push(citaData);
            } else {
                const idx = this.citas.findIndex(c => String(c.id) === String(id));
                if (idx >= 0) this.citas[idx] = citaData;
            }
        }

        this.renderCalendar();
        this.updateBadge();
        this.closeCitaModal();
        
        // Refresh day detail if open
        const panel = document.getElementById('citas-day-detail');
        if (panel.style.display !== 'none') {
            this.showDayDetail(document.getElementById('cita-fecha').value);
        }
    },

    async deleteCita() {
        const id = document.getElementById('cita-id').value;
        if (!id) return;
        
        const deleteAction = async () => {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                const { error } = await supabaseClient.from('citas').delete().eq('id', id);
                if (error) console.error('Error deleting cita:', error);
            }
            
            this.citas = this.citas.filter(c => String(c.id) !== String(id));
            this.renderCalendar();
            this.updateBadge();
            this.closeCitaModal();
            
            const panel = document.getElementById('citas-day-detail');
            if (panel.style.display !== 'none') {
                const currentFecha = document.getElementById('cita-fecha').value;
                this.showDayDetail(currentFecha);
            }
        };

        if (typeof window.showConfirm !== 'undefined') {
            window.showConfirm('¿Estás seguro de que quieres eliminar esta cita?', deleteAction);
        } else if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
            deleteAction();
        }
    }
};
