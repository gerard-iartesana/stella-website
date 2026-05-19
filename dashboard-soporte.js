/**
 * Dashboard Soporte Module
 * Roots by Stella — Envío de incidencias a iARTESANA
 * 
 * Gestiona la creación y visualización de incidencias de soporte
 * que se insertan en la tabla `incidencia_soporte` del proyecto
 * Supabase de iARTESANA (otro proyecto).
 */

const SoporteModule = (() => {
    // --- State ---
    let incidencias = [];
    let filtroActual = 'todas';

    // --- DOM References ---
    const getEls = () => ({
        list: document.getElementById('soporte-list'),
        empty: document.getElementById('soporte-empty'),
        badge: document.getElementById('soporte-badge'),
        filterAbiertas: document.getElementById('filter-abiertas'),
        filterTodas: document.getElementById('filter-todas-soporte'),
        configWarning: document.getElementById('soporte-config-warning'),
    });

    // --- Init ---
    function init() {
        // Inicializar cliente iARTESANA
        if (typeof initIartesana === 'function') initIartesana();

        const els = getEls();

        // Mostrar warning si no está configurado
        if (typeof isIartesanaConfigured === 'function' && !isIartesanaConfigured()) {
            if (els.configWarning) els.configWarning.style.display = 'block';
            if (els.empty) els.empty.style.display = 'none';
            console.warn('⚠️ Soporte: iARTESANA no configurada (UUIDs pendientes)');
            return;
        }

        // Event listeners para filtros
        if (els.filterAbiertas) {
            els.filterAbiertas.addEventListener('click', () => {
                filtroActual = 'abiertas';
                els.filterAbiertas.classList.add('active');
                els.filterTodas.classList.remove('active');
                renderIncidencias();
            });
        }
        if (els.filterTodas) {
            els.filterTodas.addEventListener('click', () => {
                filtroActual = 'todas';
                els.filterTodas.classList.add('active');
                els.filterAbiertas.classList.remove('active');
                renderIncidencias();
            });
        }

        // Formulario de nueva incidencia
        const form = document.getElementById('soporte-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        // Cargar incidencias
        loadIncidencias();
    }

    // --- Load ---
    async function loadIncidencias() {
        if (!iartesanaClient || !isIartesanaConfigured()) return;

        try {
            const { data, error } = await iartesanaClient
                .from('incidencia_soporte')
                .select('*')
                .eq('cliente_id', IARTESANA_STELLA_CLIENT_ID)
                .eq('canal_entrada', 'app')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            incidencias = data || [];
            renderIncidencias();
            updateBadge();
        } catch (err) {
            console.error('Error cargando incidencias:', err);
            showToast('Error al cargar incidencias', 'error');
        }
    }

    // --- Submit ---
    async function handleSubmit(e) {
        e.preventDefault();

        const titulo = document.getElementById('soporte-titulo').value.trim();
        const descripcion = document.getElementById('soporte-descripcion').value.trim();
        const tipo = document.getElementById('soporte-tipo').value;
        const prioridad = document.getElementById('soporte-prioridad').value;

        if (!titulo || !descripcion) {
            showToast('Título y descripción son obligatorios', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            // Generar código de incidencia
            const codigo = `INC-STELLA-${Date.now().toString(36).toUpperCase()}`;

            const newIncidencia = {
                organizacion_id: IARTESANA_ORG_ID,
                cliente_id: IARTESANA_STELLA_CLIENT_ID,
                codigo: codigo,
                titulo: titulo,
                descripcion: descripcion,
                tipo: tipo,
                prioridad: prioridad,
                estado: 'abierta',
                canal_entrada: 'app',
                notas_internas: `Enviada desde Dashboard Roots by Stella — ${new Date().toLocaleString('es-ES')}`,
            };

            const { data, error } = await iartesanaClient
                .from('incidencia_soporte')
                .insert([newIncidencia])
                .select();

            if (error) throw error;

            // Limpiar formulario
            e.target.reset();

            // Cerrar modal
            closeSoporteModal();

            // Recargar lista
            await loadIncidencias();

            showToast('✓ Incidencia enviada correctamente', 'success');

        } catch (err) {
            console.error('Error enviando incidencia:', err);
            showToast('Error al enviar incidencia: ' + err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    // --- Render ---
    function renderIncidencias() {
        const els = getEls();
        if (!els.list) return;

        let filtered = incidencias;
        if (filtroActual === 'abiertas') {
            filtered = incidencias.filter(i => !['cerrada', 'resuelta', 'descartada'].includes(i.estado));
        }

        if (filtered.length === 0) {
            els.list.innerHTML = '';
            if (els.empty) {
                els.empty.style.display = 'block';
                els.empty.querySelector('p:last-child').textContent = 
                    filtroActual === 'abiertas' 
                        ? 'No hay incidencias abiertas.' 
                        : 'No hay incidencias registradas.';
            }
            return;
        }

        if (els.empty) els.empty.style.display = 'none';

        els.list.innerHTML = filtered.map(inc => `
            <div class="item-card soporte-card ${inc.estado}">
                <div class="soporte-card-header">
                    <div class="soporte-card-meta">
                        <span class="soporte-badge-estado estado-${inc.estado}">${formatEstado(inc.estado)}</span>
                        <span class="soporte-badge-prioridad prioridad-${inc.prioridad}">${inc.prioridad.toUpperCase()}</span>
                        <span class="soporte-badge-tipo">${formatTipo(inc.tipo)}</span>
                    </div>
                    <span class="soporte-codigo">${inc.codigo || '—'}</span>
                </div>
                <div class="item-info">
                    <h3>${escapeHtml(inc.titulo)}</h3>
                    <p>${escapeHtml(inc.descripcion.substring(0, 120))}${inc.descripcion.length > 120 ? '...' : ''}</p>
                </div>
                <div class="soporte-card-footer">
                    <span class="soporte-fecha">📅 ${formatFecha(inc.creado_en)}</span>
                    ${inc.fecha_resolucion ? `<span class="soporte-resolucion">✓ Resuelta: ${formatFecha(inc.fecha_resolucion)}</span>` : ''}
                    ${inc.resolucion ? `<span class="soporte-respuesta" title="${escapeHtml(inc.resolucion)}">💬 Con respuesta</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    // --- Badge ---
    function updateBadge() {
        const els = getEls();
        if (!els.badge) return;
        const abiertas = incidencias.filter(i => !['cerrada', 'resuelta', 'descartada'].includes(i.estado)).length;
        if (abiertas > 0) {
            els.badge.textContent = abiertas;
            els.badge.style.display = 'inline-flex';
        } else {
            els.badge.style.display = 'none';
        }
    }

    // --- Modal ---
    function closeSoporteModal() {
        const overlay = document.getElementById('soporte-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    function openSoporteModal() {
        const overlay = document.getElementById('soporte-modal-overlay');
        if (overlay) overlay.classList.add('active');
        const form = document.getElementById('soporte-form');
        if (form) form.reset();
    }

    // --- Helpers ---
    function formatEstado(estado) {
        const map = {
            'abierta': 'Abierta',
            'en_curso': 'En curso',
            'esperando_cliente': 'Esperando respuesta',
            'resuelta': 'Resuelta',
            'cerrada': 'Cerrada',
            'descartada': 'Descartada'
        };
        return map[estado] || estado;
    }

    function formatTipo(tipo) {
        const map = {
            'bug': '🐛 Bug',
            'consulta': '❓ Consulta',
            'peticion_mejora': '✨ Mejora',
            'incidencia_critica': '🔥 Crítica',
            'formacion': '📚 Formación',
            'otro': '📋 Otro'
        };
        return map[tipo] || tipo;
    }

    function formatFecha(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        // Reutilizar el save-status del dashboard si existe
        const status = document.getElementById('save-status');
        if (status) {
            status.textContent = message;
            status.className = `status-msg ${type === 'success' ? 'status-success' : type === 'error' ? 'status-error' : ''}`;
            setTimeout(() => { status.textContent = ''; status.className = 'status-msg'; }, 4000);
        }
    }

    // --- Public API ---
    return {
        init,
        loadIncidencias,
        openModal: openSoporteModal,
        closeModal: closeSoporteModal,
    };
})();
