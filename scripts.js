/* =======================================================
   scripts.js — календарь, эффекты, форма поиска
   ======================================================= */

/* ---------- Helper to format date DD.MM.YYYY ---------- */
function formatDate(date) {
    let d = date.getDate().toString().padStart(2, "0");
    let m = (date.getMonth() + 1).toString().padStart(2, "0");
    let y = date.getFullYear();
    return `${d}.${m}.${y}`;
}

/* =======================================================
   CUSTOM CALENDAR CLASS
   ======================================================= */

/* ========================================================
   CUSTOM CALENDAR CLASS WITH SMOOTH MONTH TRANSITION
   ======================================================== */

   class CustomCalendar {
    constructor(inputId, popupId, options = {}) {
        this.input = document.getElementById(inputId);
        this.popup = document.getElementById(popupId);

        this.onSelect = options.onSelect || function () { };

        this.date = new Date(); // текущий месяц
        this.selected = null;   // выбранная дата
        this.minDate = options.minDate || new Date(); // нельзя прошлые

        this.buildCalendar();
        this.attachEvents();
    }

    /* ----- Рендер календаря ----- */
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
        
        // Добавляем плавность после рендера
        setTimeout(() => {
            if (this.popup.querySelector('.calendar-days')) {
                this.popup.querySelector('.calendar-days').style.opacity = '1';
            }
            if (this.popup.querySelector('.calendar-title')) {
                this.popup.querySelector('.calendar-title').style.opacity = '1';
            }
        }, 50);
    }

    /* ----- Получить название месяца ----- */
    getMonthName(i) {
        const names = [
            "Январь","Февраль","Март","Апрель","Май","Июнь",
            "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
        ];
        return names[i];
    }

    /* ----- Плавное переключение месяцев ----- */
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

    /* ----- Навигация ----- */
    prevMonth() {
        this.animateMonthChange(-1);
    }

    nextMonth() {
        this.animateMonthChange(1);
    }

    /* ----- Открытие календаря ----- */
    open() {
        document.querySelectorAll(".calendar-popup.open").forEach(p => {
            if (p !== this.popup) p.classList.remove("open");
        });
        this.popup.classList.add("open");
    }

    /* ----- Закрытие ----- */
    close() {
        this.popup.classList.remove("open");
    }

    /* ----- События ----- */
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

let checkInCalendar = new CustomCalendar("checkIn", "calendarIn", {
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

let checkOutCalendar = new CustomCalendar("checkOut", "calendarOut", {
    minDate: today
});

/* =======================================================
   TOAST
   ======================================================= */

function showToast(msg) {
    let toast = document.getElementById("toastSuccess");
    if (!toast) {
        toast = document.getElementById("toast");
    }
    if (toast) {
        toast.textContent = msg;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }
}

/* =======================================================
   BOOKING FORM
   ======================================================= */

document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let inVal = document.getElementById("checkIn").value.trim();
            let outVal = document.getElementById("checkOut").value.trim();
            let guests = document.getElementById("guests").value;
            if (!inVal || !outVal || !guests) {
                showToast("Заполните все поля");
                return;
            }
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
});

/* =======================================================
   ENHANCED ANIMATIONS (ON LOAD AND ON SCROLL)
   ======================================================= */
function animateOnScroll() {
    let blocks = document.querySelectorAll(".fade-block");
    let windowHeight = window.innerHeight;
    
    blocks.forEach(block => {
        let elementTop = block.getBoundingClientRect().top;
        let elementVisible = 150; // Начинаем анимацию когда блок на 150px от верха
        
        if (elementTop < windowHeight - elementVisible) {
            block.classList.add("show-anim");
        }
    });
}

function initAnimations() {
    // Показываем видимые блоки сразу при загрузке
    animateOnScroll();
    
    // Добавляем обработчик скролла
    window.addEventListener("scroll", animateOnScroll);
}

window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    initAnimations();
    
    // Дополнительный вызов через небольшой таймаут для уверенности
    setTimeout(animateOnScroll, 100);
});

// Также запускаем анимацию когда DOM загружен
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateOnScroll, 300);
});
/* ========================================================
   ATTRACTIONS SLIDER - SMOOTH ANIMATION VERSION
   ======================================================== */

   let currentAttractionSlide = 0;
   let attractionAutoPlayInterval;
   
   function initAttractionsSlider() {
       const slides = document.querySelectorAll('.attraction-slide');
       const dots = document.querySelectorAll('.slider-dots .dot');
       
       if (slides.length === 0) return;
       
       console.log('Initializing attractions slider with', slides.length, 'slides');
       
       // Показываем первый слайд
       showAttractionSlide(0);
       
       // Запускаем автоплей
       startAttractionSliderAutoPlay();
   }
   
   function showAttractionSlide(index) {
       const slides = document.querySelectorAll('.attraction-slide');
       const dots = document.querySelectorAll('.slider-dots .dot');
       
       if (slides.length === 0) return;
       
       // Скрываем все слайды с анимацией
       slides.forEach(slide => {
           if (slide.classList.contains('active')) {
               slide.style.opacity = '0';
               setTimeout(() => {
                   slide.classList.remove('active');
               }, 300);
           }
       });
       
       dots.forEach(dot => dot.classList.remove('active'));
       
       // Показываем текущий слайд с плавной анимацией
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
   
   // Автоматическая смена слайдов каждые 5 секунд
   function startAttractionSliderAutoPlay() {
       if (attractionAutoPlayInterval) {
           clearInterval(attractionAutoPlayInterval);
       }
       
       attractionAutoPlayInterval = setInterval(() => {
           nextAttraction();
       }, 5000);
   }
// Останавливаем автоплей при наведении на слайдер
function setupSliderHover() {
    const slider = document.querySelector('.attractions-slider');
    if (slider) {
        slider.addEventListener('mouseenter', () => {
            if (attractionAutoPlayInterval) {
                clearInterval(attractionAutoPlayInterval);
            }
        });
        
        slider.addEventListener('mouseleave', () => {
            startAttractionSliderAutoPlay();
        });
    }
}

/* =======================================================
   FAQ ACCORDION - WORKING VERSION
   ======================================================= */

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    console.log('Initializing FAQ with', faqItems.length, 'items');
    
    // Закрываем все вопросы при загрузке
    faqItems.forEach(item => {
        item.classList.remove('active');
    });
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Закрываем все другие вопросы
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Переключаем текущий вопрос
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });
    
    console.log('FAQ initialization complete');
}

/* =======================================================
   MOBILE MENU FUNCTIONALITY
   ======================================================= */

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (menuToggle && mobileMenu && mobileOverlay) {
        // Открытие/закрытие меню
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Закрытие меню по клику на оверлей
        mobileOverlay.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            this.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Закрытие меню по клику на ссылку
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Закрытие меню по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                menuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

/* =======================================================
   INITIALIZATION ON LOAD
   ======================================================= */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing all features');
    
    // Мобильное меню
    initMobileMenu();
    
    // Слайдер достопримечательностей
    initAttractionsSlider();
    setupSliderHover();
    
    // FAQ аккордеон
    initFAQ();
    
    // Инициализация модальных окон и галерей
    initModals();
});

window.addEventListener("load", function() {
    console.log('Page fully loaded - starting animations');
    
    // Анимации (сразу при загрузке И при скролле)
    document.body.classList.add("loaded");
    initAnimations();
});

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

function initSliders() {
    const sliders = document.querySelectorAll('.room-slider');
    sliders.forEach(slider => {
        const firstSlide = slider.querySelector('img');
        const firstIndicator = slider.querySelector('.slider-indicator');
        if (firstSlide && !firstSlide.classList.contains('active')) {
            firstSlide.classList.add('active');
        }
        if (firstIndicator && !firstIndicator.classList.contains('active')) {
            firstIndicator.classList.add('active');
        }
    });
}

// Инициализация слайдеров при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.room-slider')) {
        initSliders();
    }
});

/* =======================================================
   UNIFIED MODAL FUNCTIONALITY (FOR ALL MODALS)
   ======================================================= */

function initModals() {
    // Обработчики для всех типов модальных окон
    setupModalHandlers('.premium-modal', '.premium-close-modal');
    setupModalHandlers('.room-modal', '.close-modal');
    setupModalHandlers('.service-modal', '.service-close-modal');
    setupModalHandlers('.swiss-modal', '.swiss-close-modal');
    
    // Инициализация галерей после загрузки DOM
    setTimeout(initModalGalleries, 100);
}

function setupModalHandlers(modalSelector, closeSelector) {
    // Закрытие модальных окон по кнопке
    document.querySelectorAll(closeSelector).forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest(modalSelector);
            if (modal) {
                closeModal(modal);
            }
        });
    });
    
    // Закрытие при клике вне модального окна
    document.querySelectorAll(modalSelector).forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
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

// Универсальные функции для открытия модальных окон
function openPremiumModal(modalType) {
    const modalId = `modal-${modalType}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function openServiceModal(serviceType) {
    openPremiumModal(serviceType); // Используем ту же функцию, так как оба типа используют premium-modal
}

function openRoomModal(roomType) {
    const modalId = `modal-${roomType.toLowerCase().replace(' ', '-')}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие по ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

/* =======================================================
   GALLERY FUNCTIONALITY FOR MODALS
   ======================================================= */

function initModalGalleries() {
    document.querySelectorAll('.premium-modal').forEach(modal => {
        const mainImage = modal.querySelector('.premium-main-image');
        const sideImages = modal.querySelectorAll('.premium-side-image');
        
        if (mainImage && sideImages.length > 0) {
            sideImages.forEach((sideImage, index) => {
                sideImage.addEventListener('click', function() {
                    // Сохраняем текущее основное изображение
                    const tempSrc = mainImage.style.backgroundImage;
                    
                    // Меняем местами основное и боковое изображение
                    mainImage.style.backgroundImage = this.style.backgroundImage;
                    this.style.backgroundImage = tempSrc;
                    
                    // Добавляем анимацию
                    mainImage.style.opacity = '0';
                    setTimeout(() => {
                        mainImage.style.opacity = '1';
                    }, 150);
                });
                
                // Добавляем hover эффект
                sideImage.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05)';
                    this.style.transition = 'transform 0.3s ease';
                });
                
                sideImage.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        }
    });
}

/* =======================================================
   BOOKING FUNCTIONS
   ======================================================= */

function bookRoom(roomName) {
    if (!roomName) {
        console.error('Room name is required');
        return;
    }
    
    closeAllModals();
    
    const urlParams = new URLSearchParams(window.location.search);
    const bookingParams = new URLSearchParams();
    
    bookingParams.set('room', roomName);
    
    const checkin = urlParams.get('checkin') || '15.11.2024';
    const checkout = urlParams.get('checkout') || '18.11.2024';
    const guests = urlParams.get('guests') || '2 гостя';
    
    bookingParams.set('checkin', checkin);
    bookingParams.set('checkout', checkout);
    bookingParams.set('guests', guests);
    
    window.location.href = "booking.html?" + bookingParams.toString();
}

function bookService(serviceName) {
    if (!serviceName) {
        console.error('Service name is required');
        return;
    }
    
    closeAllModals();
    
    const params = new URLSearchParams();
    params.set('service', serviceName);
    params.set('type', 'spa');
    
    window.location.href = "booking.html?" + params.toString();
}

// Глобальные функции для вызова из HTML
window.openPremiumModal = openPremiumModal;
window.openServiceModal = openServiceModal;
window.openRoomModal = openRoomModal;
window.bookRoom = bookRoom;
window.bookService = bookService;
window.closeAllModals = closeAllModals;
// После открытия модалки — сделай миниатюры кликабельными
document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.classList.contains('premium-side-image') && target.src) {
        const mainImage = document.getElementById("modal-main-image");
        mainImage.src = target.src;
        mainImage.alt = target.alt;
    }
});
const roomData = {
    standard: {
        title: "Стандарт номер — с 1 кроватью",
        images: [
            "rooms/standard/1.jpg",
            "rooms/standard/2.jpg",
            "rooms/standard/3.jpg",
            "rooms/standard/4.jpg"
        ],
        description: "Уютный номер с одной кроватью...",
        parameters: [/* ... */],
        features: [/* ... */]
    },
    comfort: {
        title: "Комфорт номер — с улучшенной планировкой",
        images: [
            "rooms/comfort/1.jpg",
            "rooms/comfort/2.jpg",
            "rooms/comfort/3.jpg",
            "rooms/comfort/4.jpg"
        ],
        description: "Просторный номер...",
        parameters: [/* ... */],
        features: [/* ... */]
    },
    // ... другие номера
};
