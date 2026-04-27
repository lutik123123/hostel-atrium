/* =======================================================
   scripts.js — основной файл скриптов для сайта отеля "Атриум"
   (обновлён: поддержка нового мобильного меню)
   ======================================================= */

/* ---------- Helper to format date DD.MM.YYYY ---------- */
function formatDate(date) {
    let d = date.getDate().toString().padStart(2, "0");
    let m = (date.getMonth() + 1).toString().padStart(2, "0");
    let y = date.getFullYear();
    return `${d}.${m}.${y}`;
}

/* ========================================================
   CUSTOM CALENDAR CLASS WITH SMOOTH MONTH TRANSITION
   ======================================================== */

class CustomCalendar {
    constructor(inputId, popupId, options = {}) {
        this.input = document.getElementById(inputId);
        this.popup = document.getElementById(popupId);
        this.onSelect = options.onSelect || function () { };
        this.date = new Date();
        this.selected = null;
        this.minDate = options.minDate || new Date();

        this.buildCalendar();
        this.attachEvents();
    }

    buildCalendar() {
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

        let html = `
            <div class="calendar-header">
                <button class="prev-month">&#10094;</button>
                <div class="calendar-title">${this.getMonthName(month)} ${year}</div>
                <button class="next-month">&#10095;</button>
            </div>
            <div class="calendar-weekdays">
                ${weekdays.map(d => `<div>${d}</div>`).join("")}
            </div>
            <div class="calendar-days">
        `;

        let skip = (firstDay + 6) % 7;
        for (let i = 0; i < skip; i++) {
            html += `<div></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            let fullDate = new Date(year, month, day);
            let disabled = fullDate < this.minDate;
            html += `
                <div class="calendar-day ${disabled ? "disabled" : ""}"
                     data-date="${fullDate}">
                    ${day}
                </div>`;
        }

        html += "</div>";
        this.popup.innerHTML = html;

        setTimeout(() => {
            if (this.popup.querySelector('.calendar-days')) {
                this.popup.querySelector('.calendar-days').style.opacity = '1';
            }
            if (this.popup.querySelector('.calendar-title')) {
                this.popup.querySelector('.calendar-title').style.opacity = '1';
            }
        }, 50);
    }

    getMonthName(i) {
        const names = [
            "Январь","Февраль","Март","Апрель","Май","Июнь",
            "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
        ];
        return names[i];
    }

    animateMonthChange(direction) {
        const calendarDays = this.popup.querySelector('.calendar-days');
        const calendarTitle = this.popup.querySelector('.calendar-title');
        if (calendarDays) calendarDays.style.opacity = '0';
        if (calendarTitle) calendarTitle.style.opacity = '0';

        setTimeout(() => {
            this.date.setMonth(this.date.getMonth() + direction);
            this.buildCalendar();
            this.attachEvents();
        }, 200);
    }

    prevMonth() {
        this.animateMonthChange(-1);
    }

    nextMonth() {
        this.animateMonthChange(1);
    }

    open() {
        document.querySelectorAll(".calendar-popup.open").forEach(p => {
            if (p !== this.popup) p.classList.remove("open");
        });
        this.popup.classList.add("open");
    }

    close() {
        this.popup.classList.remove("open");
    }

    attachEvents() {
        this.input.addEventListener("click", () => this.open());

        this.popup.querySelector(".prev-month")
            .addEventListener("click", () => this.prevMonth());
        this.popup.querySelector(".next-month")
            .addEventListener("click", () => this.nextMonth());

        this.popup.querySelectorAll(".calendar-day").forEach(day => {
            day.addEventListener("click", () => {
                if (day.classList.contains("disabled")) return;
                let date = new Date(day.dataset.date);
                this.selected = date;
                this.input.value = formatDate(date);
                this.onSelect(date);
                this.close();
            });
        });

        document.addEventListener("click", (e) => {
            if (!this.input.contains(e.target) &&
                !this.popup.contains(e.target)) {
                this.close();
            }
        });
    }
}

/* =======================================================
   ИНИЦИАЛИЗАЦИЯ КАЛЕНДАРЕЙ
   ======================================================= */

const today = new Date();
today.setHours(0,0,0,0);

let checkInCalendar, checkOutCalendar;

function initializeCalendar() {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (checkInInput && checkOutInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        checkInInput.value = formatDate(today);
        checkOutInput.value = formatDate(tomorrow);
        
        checkInCalendar = new CustomCalendar("checkIn", "calendarIn", {
            minDate: today,
            onSelect: (date) => {
                let nextDay = new Date(date);
                nextDay.setDate(date.getDate() + 1);
                checkOutCalendar.minDate = nextDay;
                if (checkOutCalendar.selected < nextDay) {
                    checkOutCalendar.selected = nextDay;
                    document.getElementById("checkOut").value = formatDate(nextDay);
                }
            }
        });

        checkOutCalendar = new CustomCalendar("checkOut", "calendarOut", {
            minDate: today
        });
        
        console.log('Calendar initialized');
    }
}

/* =======================================================
   TOAST
   ======================================================= */

function showToast(msg, type = 'success') {
    let toast = document.getElementById("toastSuccess");
    if (!toast) {
        toast = document.getElementById("toast");
    }
    if (toast) {
        toast.textContent = msg;
        toast.className = `toast-success ${type}`;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }
}

/* =======================================================
   BOOKING FORM
   ======================================================= */

function initializeBookingForm() {
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let inVal = document.getElementById("checkIn").value.trim();
            let outVal = document.getElementById("checkOut").value.trim();
            let guests = document.getElementById("guests").value;
            if (!inVal || !outVal || !guests) {
                showToast("Заполните все поля", "error");
                return;
            }
            
            showToast("Поиск доступных номеров...", "info");
            
            setTimeout(() => {
                const params = new URLSearchParams({
                    checkin: inVal,
                    checkout: outVal,
                    guests: guests
                });
                window.location.href = "rooms.html?" + params.toString();
            }, 1200);
        });
    }
}

/* =======================================================
   ANIMATIONS
   ======================================================= */

function animateOnScroll() {
    let blocks = document.querySelectorAll(".fade-block");
    let windowHeight = window.innerHeight;
    
    blocks.forEach(block => {
        let elementTop = block.getBoundingClientRect().top;
        let elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
            block.classList.add("show-anim");
        }
    });
}

function initializeAnimations() {
    const fadeBlocks = document.querySelectorAll('.fade-block');
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show-anim');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeBlocks.forEach(block => {
        observer.observe(block);
    });
    
    window.addEventListener("scroll", animateOnScroll);
    console.log('Animations initialized');
}

/* ========================================================
   ATTRACTIONS SLIDER
   ======================================================== */

let currentAttractionSlide = 0;
let attractionAutoPlayInterval;

function initializeAttractionsSlider() {
    const slides = document.querySelectorAll('.attraction-slide');
    const dots = document.querySelectorAll('.slider-dots .dot');
    if (slides.length === 0) return;
    
    showAttractionSlide(0);
    startAttractionSliderAutoPlay();
    setupSliderHover();
    console.log('Attractions slider initialized');
}

function showAttractionSlide(index) {
    const slides = document.querySelectorAll('.attraction-slide');
    const dots = document.querySelectorAll('.slider-dots .dot');
    if (slides.length === 0) return;
    
    slides.forEach(slide => {
        if (slide.classList.contains('active')) {
            slide.style.opacity = '0';
            setTimeout(() => {
                slide.classList.remove('active');
            }, 300);
        }
    });
    
    dots.forEach(dot => dot.classList.remove('active'));
    
    setTimeout(() => {
        slides[index].classList.add('active');
        setTimeout(() => {
            slides[index].style.opacity = '1';
        }, 50);
    }, 300);
    
    dots[index].classList.add('active');
    currentAttractionSlide = index;
}

function nextAttraction() {
    const slides = document.querySelectorAll('.attraction-slide');
    if (slides.length === 0) return;
    currentAttractionSlide = (currentAttractionSlide + 1) % slides.length;
    showAttractionSlide(currentAttractionSlide);
}

function prevAttraction() {
    const slides = document.querySelectorAll('.attraction-slide');
    if (slides.length === 0) return;
    currentAttractionSlide = (currentAttractionSlide - 1 + slides.length) % slides.length;
    showAttractionSlide(currentAttractionSlide);
}

function goToSlide(index) {
    showAttractionSlide(index);
}

function startAttractionSliderAutoPlay() {
    if (attractionAutoPlayInterval) clearInterval(attractionAutoPlayInterval);
    attractionAutoPlayInterval = setInterval(() => {
        nextAttraction();
    }, 5000);
}

function setupSliderHover() {
    const slider = document.querySelector('.attractions-slider');
    if (slider) {
        slider.addEventListener('mouseenter', () => {
            if (attractionAutoPlayInterval) clearInterval(attractionAutoPlayInterval);
        });
        slider.addEventListener('mouseleave', () => {
            startAttractionSliderAutoPlay();
        });
    }
}

/* =======================================================
   FAQ ACCORDION
   ======================================================= */

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            faqItems.forEach(other => other.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
}

/* =======================================================
   MOBILE MENU FUNCTIONALITY (ОБНОВЛЁННАЯ)
   ======================================================= */

function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileClose = document.querySelector('.mobile-close');   // крестик
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    const fullVersionBtn = document.querySelector('.mobile-full-version');

    function openMenu() {
        if (menuToggle) menuToggle.classList.add('active');
        if (mobileMenu) mobileMenu.classList.add('active');
        if (mobileOverlay) mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (menuToggle) menuToggle.classList.remove('active');
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Бургер
    if (menuToggle) {
        menuToggle.addEventListener('click', openMenu);
    }

    // Оверлей
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMenu);
    }

    // Крестик
    if (mobileClose) {
        mobileClose.addEventListener('click', closeMenu);
    }

    // Ссылки меню
    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // "Полная версия" обрабатывается отдельно, не закрываем меню сразу
            if (link.classList.contains('mobile-full-version')) return;
            closeMenu();
        });
    });

    // Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Кнопка "Полная версия сайта"
    if (fullVersionBtn) {
        fullVersionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Отключаем мобильные стили (если mobile.css подключён с media)
            const mobileCss = document.querySelector('link[href="mobile.css"]');
            if (mobileCss) {
                mobileCss.removeAttribute('media');
            }
            // Добавляем класс для десктопного отображения (на случай встроенных стилей)
            document.body.classList.add('desktop-view');
            // Сохраняем выбор
            localStorage.setItem('desktopView', 'true');
            closeMenu();
        });
    }

    // При загрузке проверяем, не выбрана ли полная версия ранее
    if (localStorage.getItem('desktopView') === 'true') {
        const mobileCss = document.querySelector('link[href="mobile.css"]');
        if (mobileCss) mobileCss.removeAttribute('media');
        document.body.classList.add('desktop-view');
    }

    console.log('Mobile menu initialized (expanded)');
}

/* =======================================================
   ROOM SLIDER FUNCTIONALITY
   ======================================================= */

function nextSlide(id) {
    const slider = document.getElementById(id);
    if (!slider) return;
    const slides = slider.querySelectorAll('img');
    const indicators = slider.querySelectorAll('.slider-indicator');
    let currentIndex = Array.from(slides).findIndex(s => s.classList.contains("active"));
    slides[currentIndex].classList.remove("active");
    if (indicators[currentIndex]) indicators[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add("active");
    if (indicators[currentIndex]) indicators[currentIndex].classList.add("active");
}

function prevSlide(id) {
    const slider = document.getElementById(id);
    if (!slider) return;
    const slides = slider.querySelectorAll('img');
    const indicators = slider.querySelectorAll('.slider-indicator');
    let currentIndex = Array.from(slides).findIndex(s => s.classList.contains("active"));
    slides[currentIndex].classList.remove("active");
    if (indicators[currentIndex]) indicators[currentIndex].classList.remove("active");
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    slides[currentIndex].classList.add("active");
    if (indicators[currentIndex]) indicators[currentIndex].classList.add("active");
}

function showSlide(id, index) {
    const slider = document.getElementById(id);
    if (!slider) return;
    const slides = slider.querySelectorAll('img');
    const indicators = slider.querySelectorAll('.slider-indicator');
    slides.forEach(slide => slide.classList.remove("active"));
    indicators.forEach(indicator => indicator.classList.remove("active"));
    if (slides[index]) slides[index].classList.add("active");
    if (indicators[index]) indicators[index].classList.add("active");
}

function initializeRoomSliders() {
    const roomSliders = document.querySelectorAll('.room-slider');
    roomSliders.forEach(slider => {
        const images = slider.querySelectorAll('img');
        const prevBtn = slider.querySelector('.slider-btn.left');
        const nextBtn = slider.querySelector('.slider-btn.right');
        const indicators = slider.querySelectorAll('.slider-indicator');
        if (images.length > 0) {
            images[0].classList.add('active');
            if (indicators[0]) indicators[0].classList.add('active');
            let currentIndex = 0;

            function showImage(index) {
                images.forEach(img => img.classList.remove('active'));
                indicators.forEach(indicator => indicator.classList.remove('active'));
                images[index].classList.add('active');
                if (indicators[index]) indicators[index].classList.add('active');
                currentIndex = index;
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    let newIndex = currentIndex - 1;
                    if (newIndex < 0) newIndex = images.length - 1;
                    showImage(newIndex);
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    let newIndex = currentIndex + 1;
                    if (newIndex >= images.length) newIndex = 0;
                    showImage(newIndex);
                });
            }
            indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    showImage(index);
                });
            });

            if (images.length > 1) {
                setInterval(() => {
                    let newIndex = currentIndex + 1;
                    if (newIndex >= images.length) newIndex = 0;
                    showImage(newIndex);
                }, 4000);
            }
        }
    });
}

/* =======================================================
   UNIFIED MODAL FUNCTIONALITY (ALL MODALS)
   ======================================================= */

function initializeModalWindows() {
    setupModalHandlers('.premium-modal', '.premium-close-modal');
    setupModalHandlers('.room-modal', '.close-modal');
    setupModalHandlers('.service-modal', '.service-close-modal');
    setupModalHandlers('.swiss-modal', '.swiss-close-modal');
    setTimeout(initModalGalleries, 100);
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('premium-modal') || 
            e.target.classList.contains('room-modal') || 
            e.target.classList.contains('service-modal') || 
            e.target.classList.contains('swiss-modal')) {
            closeModal(e.target);
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAllModals();
    });
}

function setupModalHandlers(modalSelector, closeSelector) {
    document.querySelectorAll(closeSelector).forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest(modalSelector);
            if (modal) closeModal(modal);
        });
    });
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeAllModals() {
    document.querySelectorAll('.premium-modal, .room-modal, .service-modal, .swiss-modal').forEach(modal => {
        closeModal(modal);
    });
}

function openPremiumModal(modalType) {
    const modalId = `modal-${modalType}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        closeAllModals();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function openServiceModal(serviceType) {
    openPremiumModal(serviceType);
}

function openRoomModal(roomType) {
    const modalId = `modal-${roomType.toLowerCase().replace(' ', '-')}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        closeAllModals();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/* =======================================================
   GALLERY FUNCTIONALITY FOR MODALS
   ======================================================= */

function initModalGalleries() {
    document.querySelectorAll('.premium-modal').forEach(modal => {
        const mainImage = modal.querySelector('.premium-main-image');
        const sideImages = modal.querySelectorAll('.premium-side-image');
        if (mainImage && sideImages.length > 0) {
            sideImages.forEach((sideImage) => {
                sideImage.addEventListener('click', function() {
                    const tempSrc = mainImage.style.backgroundImage;
                    mainImage.style.backgroundImage = this.style.backgroundImage;
                    this.style.backgroundImage = tempSrc;
                    mainImage.style.opacity = '0';
                    setTimeout(() => { mainImage.style.opacity = '1'; }, 150);
                });
            });
        }
    });
}

/* =======================================================
   FORM VALIDATION
   ======================================================= */

function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredInputs = this.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ff6b6b';
                    input.addEventListener('input', function() {
                        this.style.borderColor = '';
                    });
                }
            });
            if (!isValid) {
                e.preventDefault();
                showToast('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    });
}

/* =======================================================
   VK PAGE INITIALIZATION
   ======================================================= */

function initializeVKPage() {
    if (window.location.pathname.includes('vk.html')) {
        updateActiveNavLink('vk.html');
        initializeVKFunctionality();
    }
}

function updateActiveNavLink(activePage) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === activePage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        if (link.getAttribute('href') === activePage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function initializeVKFunctionality() {
    const publishBtn = document.getElementById('publishBtn');
    const previewBtn = document.getElementById('previewBtn');
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            this.classList.add('button-loading');
            this.disabled = true;
            setTimeout(() => {
                this.classList.remove('button-loading');
                this.disabled = false;
                const successMessage = document.getElementById('successMessage');
                if (successMessage) {
                    successMessage.style.display = 'block';
                    setTimeout(() => { successMessage.style.display = 'none'; }, 3000);
                }
            }, 2000);
        });
    }
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            const postText = document.getElementById('postText');
            if (postText && postText.value.trim()) {
                alert('Предпросмотр поста:\n\n' + postText.value);
            } else {
                alert('Введите текст поста для предпросмотра');
            }
        });
    }
    const scheduleToggle = document.getElementById('scheduleToggle');
    const datetimeInput = document.getElementById('datetimeInput');
    if (scheduleToggle && datetimeInput) {
        scheduleToggle.addEventListener('change', function() {
            if (this.checked) {
                datetimeInput.classList.add('active');
            } else {
                datetimeInput.classList.remove('active');
            }
        });
    }
}

/* =======================================================
   GLOBAL FUNCTIONS AND UTILITIES
   ======================================================= */

window.formatPrice = function(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
};

window.isMobile = function() {
    return window.innerWidth <= 768;
};

window.addEventListener('resize', function() {
    if (window.isMobile()) {
        document.body.classList.add('mobile');
    } else {
        document.body.classList.remove('mobile');
    }
});

window.openPremiumModal = openPremiumModal;
window.openServiceModal = openServiceModal;
window.openRoomModal = openRoomModal;
window.closeAllModals = closeAllModals;
window.showToast = showToast;
window.nextAttraction = nextAttraction;
window.prevAttraction = prevAttraction;
window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.showSlide = showSlide;

/* =======================================================
   MAIN INITIALIZATION
   ======================================================= */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing all features');
    
    initializeMobileMenu();      // обновлённая версия
    initializeCalendar();
    initializeBookingForm();
    initializeAnimations();
    initializeAttractionsSlider();
    initializeFAQ();
    initializeModalWindows();
    initializeRoomSliders();
    initializeFormValidation();
    initializeVKPage();
    
    console.log('All scripts initialized successfully');
});

window.addEventListener("load", function() {
    document.body.classList.add("loaded");
    setTimeout(animateOnScroll, 100);
    if (window.isMobile()) {
        document.body.classList.add('mobile');
    }
});