// scripts.js - Основные скрипты для сайта отеля "Атриум"

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing scripts');
    
    initializeMobileMenu();
    initializeCalendar();
    initializeAnimations();
    initializeAttractionsSlider();
    initializeFAQAccordion();
    initializeVKPage();
    
    // Добавляем обработчики для модальных окон
    initializeModalWindows();
    
    console.log('All scripts initialized successfully');
});

// ================= MOBILE MENU =================
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');

    if (menuToggle && mobileMenu && overlay) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        overlay.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            this.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Закрытие меню при клике на ссылку
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        console.log('Mobile menu initialized');
    } else {
        console.log('Mobile menu elements not found');
    }
}

// ================= CALENDAR =================
function initializeCalendar() {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (checkInInput && checkOutInput) {
        // Устанавливаем начальные даты
        setInitialDates();
        
        // Создаем календари
        createCalendar('checkIn', 'calendarIn');
        createCalendar('checkOut', 'calendarOut');
        
        console.log('Calendar initialized');
    }
}

function setInitialDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('checkIn').value = formatDate(today);
    document.getElementById('checkOut').value = formatDate(tomorrow);
}

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function createCalendar(inputId, calendarId) {
    const input = document.getElementById(inputId);
    const calendar = document.getElementById(calendarId);
    
    if (!input || !calendar) return;
    
    input.addEventListener('focus', function() {
        // Закрываем другие календари
        document.querySelectorAll('.calendar-popup').forEach(popup => {
            if (popup.id !== calendarId) {
                popup.classList.remove('open');
            }
        });
        // Открываем текущий
        calendar.classList.add('open');
        renderCalendar(calendar, inputId);
    });
    
    // Закрытие календаря при клике вне его
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !calendar.contains(e.target)) {
            calendar.classList.remove('open');
        }
    });
}

function renderCalendar(calendar, type) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Заголовок календаря
    calendar.innerHTML = `
        <div class="calendar-header">
            <button class="prev-month"><i class="fas fa-chevron-left"></i></button>
            <div class="calendar-title">${getMonthName(currentMonth)} ${currentYear}</div>
            <button class="next-month"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="calendar-weekdays">
            <div>Пн</div>
            <div>Вт</div>
            <div>Ср</div>
            <div>Чт</div>
            <div>Пт</div>
            <div>Сб</div>
            <div>Вс</div>
        </div>
        <div class="calendar-days"></div>
    `;
    
    const daysContainer = calendar.querySelector('.calendar-days');
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Корректировка для понедельника как первого дня
    let startDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Пустые ячейки для начала месяца
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day disabled';
        emptyDay.textContent = '';
        daysContainer.appendChild(emptyDay);
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const date = new Date(currentYear, currentMonth, day);
        if (date < new Date().setHours(0,0,0,0)) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', function() {
                selectDate(day, currentMonth, currentYear, type);
            });
        }
        
        daysContainer.appendChild(dayElement);
    }
    
    // Обработчики для кнопок переключения месяцев
    calendar.querySelector('.prev-month').addEventListener('click', function() {
        // Здесь можно добавить логику для переключения на предыдущий месяц
        console.log('Previous month clicked');
    });
    
    calendar.querySelector('.next-month').addEventListener('click', function() {
        // Здесь можно добавить логику для переключения на следующий месяц
        console.log('Next month clicked');
    });
}

function selectDate(day, month, year, type) {
    const dateStr = `${day.toString().padStart(2, '0')}.${(month + 1).toString().padStart(2, '0')}.${year}`;
    document.getElementById(type === 'checkIn' ? 'checkIn' : 'checkOut').value = dateStr;
    document.getElementById(type === 'checkIn' ? 'calendarIn' : 'calendarOut').classList.remove('open');
    
    // Если выбрана дата заезда, обновляем минимальную дату для выезда
    if (type === 'checkIn') {
        const checkInDate = new Date(year, month, day);
        setMinDateForCheckout(checkInDate);
    }
}

function setMinDateForCheckout(minDate) {
    // Можно добавить логику для установки минимальной даты в календаре выезда
    console.log('Setting min date for checkout:', minDate);
}

function getMonthName(monthIndex) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthIndex];
}

// ================= ANIMATIONS =================
function initializeAnimations() {
    const fadeBlocks = document.querySelectorAll('.fade-block');
    
    // Сразу показываем блоки если страница уже загружена
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
    
    console.log('Animations initialized');
}

// ================= ATTRACTIONS SLIDER =================
function initializeAttractionsSlider() {
    const slides = document.querySelectorAll('.attraction-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-nav-btn.prev');
    const nextBtn = document.querySelector('.slider-nav-btn.next');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        currentSlide = (n + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
        });
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // Автопрокрутка каждые 5 секунд
    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000);
    
    console.log('Attractions slider initialized');
}

// Глобальные функции для слайдера
window.prevAttraction = function() {
    const slides = document.querySelectorAll('.attraction-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
    
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
};

window.nextAttraction = function() {
    const slides = document.querySelectorAll('.attraction-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
    
    currentSlide = (currentSlide + 1) % slides.length;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
};

window.goToSlide = function(index) {
    const slides = document.querySelectorAll('.attraction-slide');
    const dots = document.querySelectorAll('.dot');
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[index].classList.add('active');
    dots[index].classList.add('active');
};

// ================= FAQ ACCORDION =================
function initializeFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const toggle = item.querySelector('.faq-toggle');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Закрываем все остальные
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Переключаем текущий
            if (!isActive) {
                item.classList.add('active');
            }
        });
        
        // Также обрабатываем клик по самому toggle
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = item.classList.contains('active');
                
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
    
    console.log('FAQ accordion initialized');
}

// ================= VK PAGE INITIALIZATION =================
function initializeVKPage() {
    // Если мы на странице vk.html, добавляем специфичную инициализацию
    if (window.location.pathname.includes('vk.html')) {
        console.log('Initializing VK page');
        
        // Обновляем активную ссылку в навигации
        updateActiveNavLink('vk.html');
        
        // Инициализируем функционал VK страницы
        initializeVKFunctionality();
    }
}

function updateActiveNavLink(activePage) {
    // Обновляем десктопное меню
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === activePage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Обновляем мобильное меню
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
    // Здесь можно добавить специфичный функционал для страницы VK
    const publishBtn = document.getElementById('publishBtn');
    const previewBtn = document.getElementById('previewBtn');
    
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            // Эмуляция публикации
            this.classList.add('button-loading');
            this.disabled = true;
            
            setTimeout(() => {
                this.classList.remove('button-loading');
                this.disabled = false;
                
                // Показываем уведомление об успехе
                const successMessage = document.getElementById('successMessage');
                if (successMessage) {
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                    }, 3000);
                }
            }, 2000);
        });
    }
    
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            // Эмуляция предпросмотра
            const postText = document.getElementById('postText');
            if (postText && postText.value.trim()) {
                alert('Предпросмотр поста:\n\n' + postText.value);
            } else {
                alert('Введите текст поста для предпросмотра');
            }
        });
    }
    
    // Инициализация переключателя расписания
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
    
    console.log('VK functionality initialized');
}

// ================= MODAL WINDOWS =================
function initializeModalWindows() {
    // Закрытие модальных окон при клике на overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('premium-modal') || 
            e.target.classList.contains('room-modal') || 
            e.target.classList.contains('service-modal') || 
            e.target.classList.contains('swiss-modal')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Закрытие модальных окон при клике на кнопку закрытия
    document.querySelectorAll('.close-modal, .swiss-close-modal, .premium-close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.premium-modal, .room-modal, .service-modal, .swiss-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Закрытие модальных окон при нажатии Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.premium-modal, .room-modal, .service-modal, .swiss-modal').forEach(modal => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    });
    
    console.log('Modal windows initialized');
}

// ================= ROOM SLIDERS =================
function initializeRoomSliders() {
    const roomSliders = document.querySelectorAll('.room-slider');
    
    roomSliders.forEach(slider => {
        const images = slider.querySelectorAll('img');
        const prevBtn = slider.querySelector('.slider-btn.left');
        const nextBtn = slider.querySelector('.slider-btn.right');
        const indicators = slider.querySelectorAll('.slider-indicator');
        
        if (images.length > 1) {
            let currentIndex = 0;
            
            function showImage(index) {
                images.forEach(img => img.classList.remove('active'));
                indicators.forEach(indicator => indicator.classList.remove('active'));
                
                images[index].classList.add('active');
                if (indicators[index]) {
                    indicators[index].classList.add('active');
                }
                
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
            
            // Автопрокрутка
            setInterval(() => {
                let newIndex = currentIndex + 1;
                if (newIndex >= images.length) newIndex = 0;
                showImage(newIndex);
            }, 4000);
        }
    });
    
    console.log('Room sliders initialized');
}

// Инициализация слайдеров комнат когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRoomSliders);
} else {
    initializeRoomSliders();
}

// ================= FORM VALIDATION =================
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
                    
                    // Убираем красную обводку когда пользователь начинает вводить
                    input.addEventListener('input', function() {
                        this.style.borderColor = '';
                    });
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Пожалуйста, заполните все обязательные поля');
            }
        });
    });
    
    console.log('Form validation initialized');
}

// Инициализация валидации форм
initializeFormValidation();

// ================= UTILITY FUNCTIONS =================

// Показ уведомлений
window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toastSuccess');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast-success ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// Форматирование цены
window.formatPrice = function(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
};

// Проверка мобильного устройства
window.isMobile = function() {
    return window.innerWidth <= 768;
};

// Адаптивное поведение
window.addEventListener('resize', function() {
    if (window.isMobile()) {
        document.body.classList.add('mobile');
    } else {
        document.body.classList.remove('mobile');
    }
});

// Инициализация адаптивности
if (window.isMobile()) {
    document.body.classList.add('mobile');
}

console.log('All utility functions initialized');