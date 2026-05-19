// ============================================
// BookingModule — Roots by Stella
// Sistema de reserva de citas público
// ============================================

const BookingModule = {
    services: [],
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    existingCitas: [],

    // Configuración de horarios del salón
    HORARIOS: {
        1: { open: '16:00', close: '19:00' },  // Lunes
        2: { open: '09:00', close: '13:00' },  // Martes
        3: { open: '09:00', close: '19:00' },  // Miércoles
        4: { open: '09:00', close: '19:00' },  // Jueves
        5: { open: '09:00', close: '19:00' },  // Viernes
        6: { open: '10:00', close: '14:00' },  // Sábado
        0: null                                 // Domingo - cerrado
    },

    SLOT_INTERVAL: 30,      // minutos entre slots
    MAX_DAYS_AHEAD: 60,     // días máximo de anticipación
    DEFAULT_DURATION: 120,  // duración por defecto si no se especifica

    // ─── INIT ───────────────────────────────────────

    async init() {
        this.bindEvents();
        await this.loadServices();
        
        // Auto-open if URL has #reservar or 'reserva' param
        const params = new URLSearchParams(window.location.search);
        const serviceId = params.get('reserva');
        
        if (window.location.hash === '#reservar' || serviceId) {
            this.open(serviceId);
        }
    },

    bindEvents() {
        // Overlay close
        const overlay = document.getElementById('booking-modal-overlay');
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // Close button
        const closeBtn = document.getElementById('close-booking-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        // Back buttons
        document.getElementById('booking-back-to-services')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('booking-back-to-calendar')?.addEventListener('click', () => this.goToStep(2));

        // Calendar nav
        document.getElementById('booking-cal-prev')?.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
            this.renderCalendar();
        });
        document.getElementById('booking-cal-next')?.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
            this.renderCalendar();
        });

        // Form submit
        const form = document.getElementById('booking-client-form');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });

        // All "Reservar Cita" buttons on the page (delegated for dynamic buttons)
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-open-booking');
            if (btn) {
                const serviceId = btn.dataset.servicioId;
                
                // Si el modal está en esta página, abrirlo directamente
                if (document.getElementById('booking-modal-overlay')) {
                    e.preventDefault();
                    this.open(serviceId);
                } else if (serviceId) {
                    // Si el modal no está, redirigir a contacto.html con el parámetro
                    e.preventDefault();
                    window.location.href = `contacto.html?reserva=${serviceId}#reservar`;
                }
                // Si no hay serviceId ni modal, dejamos que el <a> funcione normal
            }
        });
    },

    async loadServices() {
        try {
            if (typeof initSupabase === 'function' && !supabaseClient) initSupabase();
            if (supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('servicios')
                    .select('*')
                    .order('orden', { ascending: true });
                if (!error && data && data.length > 0) {
                    this.services = data;
                    return;
                }
            }
        } catch (e) { console.warn('Booking: Supabase not available, using fallback'); }

        // Fallback: fetch from API
        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000/api/data' : '/api/data';
            const res = await fetch(API_URL);
            const data = await res.json();
            if (data.servicios) {
                this.services = data.servicios.map(s => ({
                    ...s,
                    duracion_minutos: this.parseDuration(s.duracion)
                }));
            }
        } catch (e) { console.error('Booking: Error loading services', e); }
    },

    // Parse "2-6 horas" or "90-120 min" → max value in minutes
    parseDuration(text) {
        if (!text) return this.DEFAULT_DURATION;
        const nums = text.match(/\d+/g);
        if (!nums || nums.length === 0) return this.DEFAULT_DURATION;
        const maxVal = Math.max(...nums.map(Number));
        // If text mentions "hora" assume value is hours
        if (text.toLowerCase().includes('hora')) return maxVal * 60;
        return maxVal;
    },

    // ─── MODAL CONTROL ──────────────────────────────

    open(preselectedServiceId) {
        this.selectedService = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();

        this.renderServices();
        this.goToStep(1);

        if (preselectedServiceId) {
            const svc = this.services.find(s => s.id === preselectedServiceId);
            if (svc) this.selectService(svc);
        }

        document.getElementById('booking-modal-overlay')?.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        document.getElementById('booking-modal-overlay')?.classList.remove('active');
        document.body.style.overflow = 'auto';
    },

    goToStep(step) {
        document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`booking-step-${step}`)?.classList.add('active');

        // Update progress indicator
        document.querySelectorAll('.booking-progress-step').forEach(s => {
            const sNum = parseInt(s.dataset.step);
            s.classList.toggle('active', sNum === step);
            s.classList.toggle('completed', sNum < step);
        });
    },

    // ─── STEP 1: SERVICES ───────────────────────────

    renderServices() {
        const container = document.getElementById('booking-services-list');
        if (!container) return;

        if (this.services.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">Cargando servicios...</p>';
            return;
        }

        container.innerHTML = this.services.map(s => {
            const dur = s.duracion_minutos || this.parseDuration(s.duracion);
            const durText = dur >= 60 ? `${Math.floor(dur/60)}h${dur%60 > 0 ? ` ${dur%60}min` : ''}` : `${dur} min`;
            const img = s.imagenes && s.imagenes.length > 0 ? s.imagenes[0] : '';
            return `<div class="booking-service-card" data-id="${s.id}">
                ${img ? `<div class="booking-service-img"><img src="${img}" alt="${s.titulo}"></div>` : ''}
                <div class="booking-service-info">
                    <h4>${s.titulo}</h4>
                    <div class="booking-service-meta">
                        <span class="booking-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            ${durText}
                        </span>
                        <span class="booking-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            ${s.precio || 'Consultar'}
                        </span>
                    </div>
                </div>
                <span class="booking-service-arrow">→</span>
            </div>`;
        }).join('');

        container.querySelectorAll('.booking-service-card').forEach(card => {
            card.addEventListener('click', () => {
                const svc = this.services.find(s => String(s.id) === String(card.dataset.id));
                if (svc) this.selectService(svc);
            });
        });
    },

    selectService(svc) {
        this.selectedService = svc;
        // Update header
        const label = document.getElementById('booking-selected-service');
        if (label) label.textContent = svc.titulo;
        this.renderCalendar();
        this.goToStep(2);
    },

    // ─── STEP 2: CALENDAR ───────────────────────────

    renderCalendar() {
        const grid = document.getElementById('booking-calendar-grid');
        const title = document.getElementById('booking-cal-title');
        if (!grid || !title) return;

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        title.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + this.MAX_DAYS_AHEAD);

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        let startDay = firstDay.getDay(); // 0=Sun
        // Convert to Mon=0
        startDay = startDay === 0 ? 6 : startDay - 1;

        const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        let html = dayHeaders.map(d => `<div class="booking-cal-header">${d}</div>`).join('');

        // Empty cells before 1st
        for (let i = 0; i < startDay; i++) {
            html += '<div class="booking-cal-day empty"></div>';
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dateStr = this.formatDate(date);
            const dayOfWeek = date.getDay();
            const horario = this.HORARIOS[dayOfWeek];

            const isPast = date < today;
            const isTooFar = date > maxDate;
            const isClosed = !horario;
            const isDisabled = isPast || isTooFar || isClosed;
            const isToday = date.getTime() === today.getTime();
            const isSelected = dateStr === this.selectedDate;

            let classes = 'booking-cal-day';
            if (isDisabled) classes += ' disabled';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';

            html += `<div class="${classes}" data-date="${dateStr}"><span>${day}</span></div>`;
        }

        grid.innerHTML = html;

        // Disable prev if showing current month
        const prevBtn = document.getElementById('booking-cal-prev');
        if (prevBtn) {
            prevBtn.disabled = (this.currentYear === today.getFullYear() && this.currentMonth <= today.getMonth());
        }

        // Bind day clicks
        grid.querySelectorAll('.booking-cal-day:not(.disabled):not(.empty)').forEach(cell => {
            cell.addEventListener('click', () => this.selectDate(cell.dataset.date));
        });
    },

    async selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.selectedTime = null;

        // Update selection in calendar
        document.querySelectorAll('.booking-cal-day').forEach(d => d.classList.remove('selected'));
        document.querySelector(`.booking-cal-day[data-date="${dateStr}"]`)?.classList.add('selected');

        // Load existing citas for that day
        await this.loadCitasForDate(dateStr);

        // Render available time slots
        this.renderTimeSlots(dateStr);
        this.goToStep(3);
    },

    async loadCitasForDate(dateStr) {
        this.existingCitas = [];
        try {
            if (supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('citas')
                    .select('hora_inicio, hora_fin, estado')
                    .eq('fecha', dateStr)
                    .neq('estado', 'cancelada');
                if (!error && data) this.existingCitas = data;
            }
        } catch (e) { console.warn('Booking: Could not load existing citas', e); }
    },

    // ─── STEP 3: TIME SLOTS ─────────────────────────

    renderTimeSlots(dateStr) {
        const container = document.getElementById('booking-slots-grid');
        const dateLabel = document.getElementById('booking-selected-date');
        if (!container) return;

        const date = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = date.getDay();
        const horario = this.HORARIOS[dayOfWeek];

        if (dateLabel) {
            dateLabel.textContent = date.toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
        }

        if (!horario) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">Este día el salón está cerrado.</p>';
            return;
        }

        const duration = this.selectedService?.duracion_minutos || this.parseDuration(this.selectedService?.duracion) || this.DEFAULT_DURATION;
        const slots = this.getAvailableSlots(horario, duration);

        if (slots.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">No hay horas disponibles este día. Prueba otro día.</p>';
            return;
        }

        container.innerHTML = slots.map(slot => {
            return `<button class="booking-slot-btn" data-time="${slot}">${slot}</button>`;
        }).join('');

        container.querySelectorAll('.booking-slot-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectTime(btn.dataset.time));
        });
    },

    getAvailableSlots(horario, durationMin) {
        const openMin = this.timeToMinutes(horario.open);
        const closeMin = this.timeToMinutes(horario.close);
        const slots = [];

        for (let t = openMin; t + durationMin <= closeMin; t += this.SLOT_INTERVAL) {
            const timeStr = this.minutesToTime(t);
            const endStr = this.minutesToTime(t + durationMin);

            // Check overlap with existing citas
            const overlaps = this.existingCitas.some(cita => {
                const citaStart = this.timeToMinutes(cita.hora_inicio);
                const citaEnd = cita.hora_fin ? this.timeToMinutes(cita.hora_fin) : citaStart + 60;
                return t < citaEnd && (t + durationMin) > citaStart;
            });

            if (!overlaps) slots.push(timeStr);
        }

        return slots;
    },

    selectTime(time) {
        this.selectedTime = time;
        document.querySelectorAll('.booking-slot-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector(`.booking-slot-btn[data-time="${time}"]`)?.classList.add('selected');

        // Show the form section
        const formSection = document.getElementById('booking-form-section');
        if (formSection) {
            formSection.style.display = 'block';
            formSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Update summary
        const summary = document.getElementById('booking-summary');
        if (summary) {
            const dur = this.selectedService?.duracion_minutos || this.parseDuration(this.selectedService?.duracion) || this.DEFAULT_DURATION;
            const endTime = this.minutesToTime(this.timeToMinutes(time) + dur);
            const dateObj = new Date(this.selectedDate + 'T00:00:00');
            summary.innerHTML = `
                <div class="booking-summary-row"><strong>Servicio:</strong> ${this.selectedService?.titulo}</div>
                <div class="booking-summary-row"><strong>Fecha:</strong> ${dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                <div class="booking-summary-row"><strong>Hora:</strong> ${time} — ${endTime}</div>
            `;
        }
    },

    // ─── SUBMIT ─────────────────────────────────────

    async submit() {
        const nombre = document.getElementById('booking-nombre').value.trim();
        const email = document.getElementById('booking-email').value.trim();
        const telefono = document.getElementById('booking-telefono').value.trim();
        const notas = document.getElementById('booking-notas').value.trim();

        if (!nombre || !this.selectedService || !this.selectedDate || !this.selectedTime) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        const dur = this.selectedService.duracion_minutos || this.parseDuration(this.selectedService.duracion) || this.DEFAULT_DURATION;
        const horaFin = this.minutesToTime(this.timeToMinutes(this.selectedTime) + dur);

        const cita = {
            nombre_cliente: nombre,
            email: email,
            telefono: telefono,
            servicio: this.selectedService.titulo,
            fecha: this.selectedDate,
            hora_inicio: this.selectedTime,
            hora_fin: horaFin,
            estado: 'pendiente',
            notas: notas || `Reservado desde la web — ${this.selectedService.titulo}`
        };

        const submitBtn = document.getElementById('booking-submit-btn');
        const statusDiv = document.getElementById('booking-status');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando...'; }

        try {
            if (typeof initSupabase === 'function' && !supabaseClient) initSupabase();

            if (supabaseClient) {
                const { error } = await supabaseClient.from('citas').insert([cita]);
                if (error) throw error;
            } else {
                throw new Error('Base de datos no disponible');
            }

            // Success
            this.showConfirmation(cita);

        } catch (error) {
            console.error('Error al reservar:', error);
            if (statusDiv) {
                statusDiv.textContent = 'Hubo un error al enviar la reserva. Puedes contactarnos directamente al 664 10 10 59.';
                statusDiv.style.color = '#dc3545';
            }
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Confirmar Reserva'; }
        }
    },

    showConfirmation(cita) {
        const modal = document.getElementById('booking-modal-content');
        if (!modal) return;

        const dateObj = new Date(cita.fecha + 'T00:00:00');

        modal.innerHTML = `
            <div class="booking-confirmation">
                <div class="booking-confirm-icon">✓</div>
                <h2>¡Reserva Enviada!</h2>
                <p class="booking-confirm-subtitle">Tu solicitud de cita ha sido registrada. Te confirmaremos por email o teléfono.</p>
                <div class="booking-confirm-details">
                    <div class="booking-confirm-row"><span>Servicio</span><strong>${cita.servicio}</strong></div>
                    <div class="booking-confirm-row"><span>Fecha</span><strong>${dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>
                    <div class="booking-confirm-row"><span>Hora</span><strong>${cita.hora_inicio} — ${cita.hora_fin}</strong></div>
                    <div class="booking-confirm-row"><span>Nombre</span><strong>${cita.nombre_cliente}</strong></div>
                </div>
                <button class="btn btn-primary" onclick="BookingModule.close()" style="margin-top:2rem;">Cerrar</button>
            </div>
        `;
    },

    // ─── HELPERS ─────────────────────────────────────

    timeToMinutes(time) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + (m || 0);
    },

    minutesToTime(min) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    formatDate(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
};

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    BookingModule.init();
});
