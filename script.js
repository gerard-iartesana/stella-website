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
                if (serviciosContainer && data.servicios) renderServicios(data.servicios);
                if (lookbookGrid && data.lookbook) renderLookbook(data.lookbook);
            })
            .catch(err => {
                console.error('Error fetching fallback data:', err);
                if (serviciosContainer) serviciosContainer.innerHTML = '<p class="text-center">Error cargando servicios.</p>';
            });
    }

    function renderServicios(servicios) {
        serviciosContainer.innerHTML = '';
        servicios.forEach(servicio => {
            let accordionHtml = '';
            servicio.imagenes.forEach((img, i) => {
                accordionHtml += `<div class="accordion-panel ${i === 0 ? 'active' : ''}" style="background-image: url('${img}');" aria-label="${servicio.titulo} ${i+1}"></div>`;
            });

            let incluyeHtml = '';
            servicio.incluye.forEach(item => {
                incluyeHtml += `<li><span class="check-icon">✓</span> ${item}</li>`;
            });

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
                    <h4 class="includes-title">Incluye:</h4>
                    <ul class="check-list">
                        ${incluyeHtml}
                    </ul>
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
        const accordionPanels = document.querySelectorAll('.accordion-panel');
        accordionPanels.forEach(panel => {
            panel.addEventListener('click', () => {
                const container = panel.closest('.image-accordion');
                const siblings = container.querySelectorAll('.accordion-panel');
                siblings.forEach(sibling => sibling.classList.remove('active'));
                panel.classList.add('active');
            });
        });
    }

    function renderLookbook(lookbook) {
        lookbookGrid.innerHTML = '';
        const reversed = [...lookbook].reverse();
        reversed.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.setAttribute('data-category', item.categoria);
            div.innerHTML = `<img src="${item.imagen}" alt="${item.alt}">`;
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

        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        
        newGalleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img && lightbox && lightboxImg) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });
    }

});
