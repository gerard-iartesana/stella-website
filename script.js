document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scrolling when menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Formulario de Contacto (Index y Página de Contacto) ---
    function setupContactForm(formId, prefix) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Dynamic CAPTCHA generation
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;
        
        const label = document.getElementById(`${prefix}-captcha-label`);
        const input = document.getElementById(`${prefix}-captcha-input`);
        const answerHidden = document.getElementById(`${prefix}-captcha-answer`);
        
        if (label && input && answerHidden) {
            label.textContent = `¿Cuánto es ${num1} + ${num2}?`;
            answerHidden.value = answer;
            input.value = '';
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = form.querySelector('button[type="submit"]');
            const statusDiv = document.getElementById(`${prefix}-form-status`);
            
            // Validate CAPTCHA
            const userAnswer = parseInt(input.value);
            const expectedAnswer = parseInt(answerHidden.value);
            
            if (userAnswer !== expectedAnswer) {
                if (statusDiv) {
                    statusDiv.textContent = 'La respuesta de seguridad es incorrecta. Inténtalo de nuevo.';
                    statusDiv.style.color = '#dc3545';
                }
                return;
            }
            
            // Get form values
            const nombre = document.getElementById(`${prefix}-nombre`).value;
            const email = document.getElementById(`${prefix}-email`).value;
            const mensaje = document.getElementById(`${prefix}-mensaje`).value;
            
            const originalText = btn.textContent;
            btn.textContent = 'Enviando...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            if (statusDiv) statusDiv.textContent = '';
            
            try {
                // Ensure Supabase is initialized
                if (typeof initSupabase === 'function' && !supabaseClient) {
                    initSupabase();
                }

                if (supabaseClient) {
                    const { error } = await supabaseClient
                        .from('mensajes')
                        .insert([{
                            nombre: nombre,
                            email: email,
                            mensaje: mensaje,
                            asunto: 'Mensaje desde formulario web'
                        }]);

                    if (error) throw error;

                    btn.textContent = 'Mensaje Enviado';
                    btn.style.backgroundColor = '#4CAF50'; // Success green
                    btn.style.opacity = '1';
                    
                    if (statusDiv) {
                        statusDiv.textContent = '¡Gracias! Hemos recibido tu mensaje y te contactaremos pronto.';
                        statusDiv.style.color = '#4CAF50';
                    }
                    
                    form.reset();
                    
                    // Regenerate CAPTCHA
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.backgroundColor = '';
                        btn.disabled = false;
                        if (statusDiv) statusDiv.textContent = '';
                        setupContactForm(formId, prefix); // re-init captcha
                    }, 4000);
                } else {
                    throw new Error('Servicio de base de datos no disponible');
                }
            } catch (error) {
                console.error('Error enviando mensaje:', error);
                btn.textContent = originalText;
                btn.style.opacity = '1';
                btn.disabled = false;
                if (statusDiv) {
                    statusDiv.textContent = 'Hubo un error al enviar el mensaje. Por favor, intenta usar nuestros datos de contacto directo.';
                    statusDiv.style.color = '#dc3545';
                }
            }
        });
    }

    setupContactForm('contact-form', 'index');
    setupContactForm('contact-page-form', 'contacto');

    // Form submission dummy handler for Academy
    const academyForm = document.getElementById('academy-form');
    if (academyForm) {
        academyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const captchaInput = document.getElementById('captcha-answer');
            if (captchaInput && parseInt(captchaInput.value) !== 11) {
                alert('La respuesta correcta es 11. Por favor, inténtalo de nuevo.');
                return;
            }
            
            const btn = academyForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            
            btn.textContent = 'Enviando...';
            btn.style.opacity = '0.7';
            
            setTimeout(() => {
                btn.textContent = 'Enviado';
                btn.style.backgroundColor = '#4CAF50';
                btn.style.opacity = '1';
                academyForm.reset();
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = 'var(--color-purple)';
                }, 3000);
            }, 1500);
        });
    }

    // Image Accordion Logic
    const accordionPanels = document.querySelectorAll('.accordion-panel');
    if (accordionPanels.length > 0) {
        accordionPanels.forEach(panel => {
            panel.addEventListener('click', () => {
                const container = panel.closest('.image-accordion');
                const siblings = container.querySelectorAll('.accordion-panel');
                siblings.forEach(sibling => {
                    sibling.classList.remove('active');
                });
                panel.classList.add('active');
            });
        });
    }

    // Gallery Filtering Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterBtns.length > 0 && galleryItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    if (filterValue === 'todos' || item.getAttribute('data-category') === filterValue) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    }

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (lightbox && galleryItems.length > 0) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
            setTimeout(() => { lightboxImg.src = ''; }, 300);
        };

        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // FAQ Accordion Logic
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.closest('.faq-item');
                // Toggle current item
                item.classList.toggle('active');
                
                // Optionally close others
                /*
                faqQuestions.forEach(q => {
                    if (q !== question) {
                        q.closest('.faq-item').classList.remove('active');
                    }
                });
                */
            });
        });
    }


    // --- Dynamic Data Fetching (Servicios & Lookbook) ---
    const serviciosContainer = document.getElementById('servicios-container');
    const lookbookGrid = document.getElementById('gallery-grid');
    
    if (serviciosContainer || lookbookGrid) {
        if (typeof initSupabase === 'function') initSupabase(); // Inicializar Supabase

        if (typeof supabase !== 'undefined' && typeof supabaseClient !== 'undefined' && supabaseClient) {
            // Fetch from Supabase
            Promise.all([
                supabaseClient.from('servicios').select('*').order('orden', { ascending: true }),
                supabaseClient.from('lookbook').select('*').order('orden', { ascending: true })
            ]).then(([resServicios, resLookbook]) => {
                if (resServicios.data) {
                    window.servicesData = resServicios.data;
                }
                
                if (serviciosContainer && resServicios.data && resServicios.data.length > 0) {
                    renderServicios(resServicios.data);
                } else if (serviciosContainer) {
                    fetchLocalFallback(); // Fallback if empty
                }
                
                if (lookbookGrid && resLookbook.data && resLookbook.data.length > 0) {
                    renderLookbook(resLookbook.data);
                }
            }).catch(err => {
                console.error('Error fetching from Supabase:', err);
                fetchLocalFallback();
            });
        } else {
            fetchLocalFallback();
        }
    }

    function fetchLocalFallback() {
        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000/api/data' : '/api/data';
            
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                if (data.servicios) {
                    window.servicesData = data.servicios;
                }
                if (serviciosContainer && data.servicios) renderServicios(data.servicios);
                if (lookbookGrid && data.lookbook) renderLookbook(data.lookbook);
            })
            .catch(err => {
                console.error('Error fetching fallback data:', err);
                if (serviciosContainer) serviciosContainer.innerHTML = '<p class="text-center">Error cargando servicios.</p>';
            });
    }

    function renderCategoryFilters(servicios) {
        const filterBar = document.getElementById('categories-filter-bar');
        if (!filterBar) return;
        
        const uniqueCategories = ['Todas', ...new Set(servicios.map(s => s.categoria || 'General'))];
        
        filterBar.innerHTML = uniqueCategories.map(cat => {
            return `<button class="category-filter-btn ${cat === 'Todas' ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
        }).join('');
        
        filterBar.querySelectorAll('.category-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterBar.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const selectedCat = btn.dataset.category;
                
                const filtered = selectedCat === 'Todas'
                    ? servicios
                    : servicios.filter(s => (s.categoria || 'General') === selectedCat);
                    
                renderFilteredServicios(filtered);
            });
        });
    }

    function renderFilteredServicios(servicios) {
        if (!serviciosContainer) return;
        serviciosContainer.innerHTML = '';
        
        if (servicios.length === 0) {
            serviciosContainer.innerHTML = '<p class="text-center" style="color: var(--color-black); opacity: 0.6; padding: 3rem; width: 100%;">No hay servicios en esta categoría.</p>';
            return;
        }

        servicios.forEach(servicio => {
            let accordionHtml = '';
            if (servicio.imagenes && Array.isArray(servicio.imagenes)) {
                servicio.imagenes.forEach((img, i) => {
                    accordionHtml += `<div class="accordion-panel ${i === 0 ? 'active' : ''}" style="background-image: url('${img}');" aria-label="${servicio.titulo} ${i+1}"></div>`;
                });
            }

            let incluyeHtml = '';
            if (servicio.incluye && Array.isArray(servicio.incluye)) {
                servicio.incluye.forEach(item => {
                    incluyeHtml += `<li><span class="check-icon">✓</span> ${item}</li>`;
                });
            }

            const row = document.createElement('div');
            row.className = 'service-row';
            row.innerHTML = `
                <div class="service-img-col image-accordion">
                    ${accordionHtml}
                </div>
                <div class="service-text-col">
                    <div class="gold-line"></div>
                    <h2 class="section-title">${servicio.titulo}</h2>
                    <p class="service-desc">${servicio.descripcion}</p>
                    ${incluyeHtml ? `<h4 class="includes-title">Incluye:</h4>
                    <ul class="check-list" style="margin-bottom: 1.5rem;">
                        ${incluyeHtml}
                    </ul>` : ''}
                    <div class="service-meta">
                        <p><strong>Duración:</strong> <span class="meta-value">${servicio.duracion}</span></p>
                        <p><strong>Precio:</strong> <span class="meta-value">${servicio.precio}</span></p>
                    </div>
                    <a href="contacto.html#reservar" class="btn btn-primary mt-3 btn-open-booking" data-servicio-id="${servicio.id}">Reservar este Servicio</a>
                </div>
            `;
            serviciosContainer.appendChild(row);
        });

        // Re-bind accordion logic for dynamically added elements
        const accordionPanels = serviciosContainer.querySelectorAll('.accordion-panel');
        accordionPanels.forEach(panel => {
            panel.addEventListener('click', () => {
                const container = panel.closest('.image-accordion');
                const siblings = container.querySelectorAll('.accordion-panel');
                siblings.forEach(sibling => sibling.classList.remove('active'));
                panel.classList.add('active');
            });
        });
    }

    function renderServicios(servicios) {
        renderCategoryFilters(servicios);
        renderFilteredServicios(servicios);
    }

    function renderLookbook(lookbook) {
        lookbookGrid.innerHTML = '';
        const reversed = [...lookbook].reverse();
        reversed.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.setAttribute('data-category', item.categoria);
            div.innerHTML = `<img src="${item.imagen}" alt="${item.alt}">`;
            
            // Evento Click para abrir el lightbox premium
            div.addEventListener('click', () => {
                const lightbox = document.getElementById('lightbox');
                const lightboxImg = document.getElementById('lightbox-img');
                
                if (lightbox && lightboxImg) {
                    lightboxImg.src = item.imagen;
                    
                    const detailsPane = document.querySelector('.lightbox-details');
                    const card = document.querySelector('.lightbox-card');
                    
                    // Buscar el servicio asociado por el título (guardado en item.servicio_id)
                    const associatedService = window.servicesData 
                        ? window.servicesData.find(s => s.titulo === item.servicio_id) 
                        : null;
                    
                    if (associatedService && detailsPane && card) {
                        detailsPane.style.display = 'flex';
                        card.style.maxWidth = '960px';
                        
                        document.getElementById('lightbox-category').textContent = item.categoria || 'Lookbook';
                        document.getElementById('lightbox-title').textContent = associatedService.titulo;
                        document.getElementById('lightbox-desc').textContent = associatedService.descripcion;
                        document.getElementById('lightbox-duration').textContent = associatedService.duracion || 'Consultar';
                        document.getElementById('lightbox-price').textContent = associatedService.precio || 'Consultar';
                        
                        const cta = document.getElementById('lightbox-cta');
                        if (cta) {
                            cta.href = `contacto.html?reserva=${associatedService.id}#reservar`;
                            cta.setAttribute('data-servicio-id', associatedService.id);
                        }
                    } else {
                        // Fallback: ocultar panel lateral y mostrar centrado
                        if (detailsPane && card) {
                            detailsPane.style.display = 'none';
                            card.style.maxWidth = '600px';
                        }
                    }
                    
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
            
            lookbookGrid.appendChild(div);
        });

        // Re-bind Filter and Lightbox logic
        const newGalleryItems = document.querySelectorAll('.gallery-item');
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            // Need to remove old listeners by replacing node or handling it cleanly
            // To be safe and simple, we clone the buttons to strip old listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                newBtn.classList.add('active');
                const filterValue = newBtn.getAttribute('data-filter');
                newGalleryItems.forEach(item => {
                    if (filterValue === 'todos' || item.getAttribute('data-category') === filterValue) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });

        // Configuración de eventos de cerrado para el Lightbox
        const lightbox = document.getElementById('lightbox');
        const lightboxClose = document.querySelector('.lightbox-close');
        
        if (lightbox) {
            const closeLightbox = () => {
                lightbox.classList.remove('active');
                document.body.style.overflow = 'auto';
                const lightboxImg = document.getElementById('lightbox-img');
                if (lightboxImg) {
                    setTimeout(() => { lightboxImg.src = ''; }, 300);
                }
            };
            
            if (lightboxClose) {
                lightboxClose.onclick = (e) => {
                    e.stopPropagation();
                    closeLightbox();
                };
            }
            
            lightbox.onclick = (e) => {
                if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
                    closeLightbox();
                }
            };
        }
    }

});
