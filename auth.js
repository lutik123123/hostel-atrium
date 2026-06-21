// auth.js - Полная система авторизации для отеля "Атриум"

class AuthManager {
    constructor() {
        console.log('AuthManager constructor called');
        if (window.authManager) {
            console.log('AuthManager уже инициализирован');
            return window.authManager;
        }
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('atrium_users')) || [];
        this.userPreferences = JSON.parse(localStorage.getItem('atrium_user_prefs')) || {};
        this.bookings = JSON.parse(localStorage.getItem('atrium_bookings')) || [];
        this.pendingBooking = null;
        this.initTestAccounts();
        this.initTestBookings();
        window.authManager = this;
        console.log('AuthManager создан успешно');
    }

    init() {
        console.log('AuthManager init called');
        this.checkAuthState();
        this.setupEventListeners();
        console.log('AuthManager инициализирован');
    }

    initTestAccounts() {
        const testAccounts = [
            {
                id: 1,
                firstName: 'Администратор',
                lastName: 'Атриум',
                phone: '+7 (999) 123-45-67',
                email: 'admin@atrium.ru',
                password: 'admin123',
                role: 'admin',
                position: 'Старший администратор',
                registrationDate: new Date().toISOString(),
                birthday: '1985-06-15'
            },
            {
                id: 2,
                firstName: 'Иван',
                lastName: 'Петров',
                phone: '+7 (888) 765-43-21',
                email: 'client@atrium.ru',
                password: 'client123',
                role: 'client',
                registrationDate: new Date().toISOString(),
                birthday: '1990-03-20'
            }
        ];
        let needsUpdate = false;
        testAccounts.forEach(testAccount => {
            if (!this.users.find(user => user.email === testAccount.email)) {
                this.users.push(testAccount);
                needsUpdate = true;
            }
        });
        if (needsUpdate) {
            localStorage.setItem('atrium_users', JSON.stringify(this.users));
            console.log('Тестовые аккаунты добавлены');
        }
    }

    initTestBookings() {
        if (this.bookings.length === 0) {
            this.bookings = [
                {
                    id: 'BKG-2024-001',
                    userId: 2,
                    type: 'room',
                    title: 'Люкс с видом на море',
                    checkin: '15.11.2024',
                    checkout: '18.11.2024',
                    guests: '2 взрослых',
                    price: 45000,
                    status: 'paid',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'BKG-2024-002',
                    userId: 2,
                    type: 'spa',
                    title: 'СПА-процедура "Релакс"',
                    date: '16.11.2024',
                    time: '15:00 - 17:00',
                    price: 8500,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'BKG-2024-003',
                    userId: 2,
                    type: 'room',
                    title: 'Стандартный номер',
                    checkin: '01.10.2024',
                    checkout: '05.10.2024',
                    guests: '1 взрослый',
                    price: 12000,
                    status: 'cancelled',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('atrium_bookings', JSON.stringify(this.bookings));
            console.log('Тестовые бронирования добавлены');
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentUser) {
                    window.location.href = 'profile.html';
                } else {
                    window.location.href = 'authorization.html';
                }
            });
        }
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentUser) {
                    window.location.href = 'profile.html';
                } else {
                    window.location.href = 'authorization.html';
                }
            });
        }
        console.log('Event listeners setup complete');
    }

    handleQuickBooking(e) {
        e.preventDefault();
        if (this.isAdmin()) {
            this.showNotification('Администратор не может бронировать номера', true);
            return;
        }
        const formData = new FormData(e.target);
        const bookingData = {
            roomName: 'Стандарт',
            checkin: formData.get('checkin'),
            checkout: formData.get('checkout'),
            guests: formData.get('guests')
        };
        this.redirectToBookingPage(bookingData);
    }

    handleLogin(email, password) {
        console.log('Login attempt with email:', email);
        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            this.login(user);
            this.showNotification('Вход выполнен успешно!');
            return true;
        } else {
            this.showNotification('Неверный email или пароль', true);
            return false;
        }
    }

    handleRegister(userData) {
        if (this.users.find(u => u.email === userData.email)) {
            this.showNotification('Пользователь с таким email уже существует', true);
            return false;
        }
        if (!this.validateEmail(userData.email)) {
            this.showNotification('Введите корректный email', true);
            return false;
        }
        if (userData.password.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', true);
            return false;
        }
        const newUser = {
            id: Date.now(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            email: userData.email,
            password: userData.password,
            role: 'client',
            registrationDate: new Date().toISOString()
        };
        this.users.push(newUser);
        localStorage.setItem('atrium_users', JSON.stringify(this.users));
        this.login(newUser);
        this.showNotification('Регистрация прошла успешно!');
        return true;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    login(user) {
        this.currentUser = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        this.updateUI();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('current_user');
        this.updateUI();
        this.showNotification('Вы вышли из аккаунта');
        if (window.location.pathname.includes('profile.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    checkAuthState() {
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
            } catch (e) {
                localStorage.removeItem('current_user');
            }
        }
        this.updateUI();
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        if (this.currentUser) {
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <div class="user-profile">
                        <div class="user-avatar">${this.getUserInitials()}</div>
                        <span class="user-name">${this.currentUser.firstName}</span>
                    </div>
                `;
                loginBtn.classList.add('user-profile-btn');
            }
            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `
                    <div class="user-profile">
                        <div class="user-avatar">${this.getUserInitials()}</div>
                        <span class="user-name">${this.currentUser.firstName}</span>
                    </div>
                `;
                mobileLoginBtn.classList.add('user-profile-btn');
            }
            const mobileLoginLink = document.querySelector('.mobile-nav-link[href="authorization.html"]');
            if (mobileLoginLink) {
                mobileLoginLink.innerHTML = `👤 ${this.currentUser.firstName}`;
                mobileLoginLink.href = 'profile.html';
            }
            this.updateVkNavigation();
        } else {
            if (loginBtn) {
                loginBtn.innerHTML = 'Войти';
                loginBtn.classList.remove('user-profile-btn');
            }
            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = 'Войти';
                mobileLoginBtn.classList.remove('user-profile-btn');
            }
            this.hideVkNavigation();
        }
        if (window.location.pathname.includes('profile.html')) {
            this.updateProfilePage();
        }
    }

    updateVkNavigation() {
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        if (isAdmin) {
            this.addVkButtonToNavigation();
        } else {
            this.hideVkNavigation();
        }
    }

    addVkButtonToNavigation() {
        const desktopNav = document.querySelector('.nav nav');
        if (desktopNav && !desktopNav.querySelector('.vk-nav-btn')) {
            const vkButton = document.createElement('a');
            vkButton.href = 'vk.html';
            vkButton.className = 'nav-link vk-nav-btn';
            vkButton.innerHTML = '<i class="fab fa-vk"></i> VK';
            vkButton.style.cssText = 'background: #2c5aa0; color: white; border-radius: 8px; padding: 8px 16px; margin-left: 10px;';
            const contactsLink = desktopNav.querySelector('a[href="contacts.html"]');
            if (contactsLink) {
                contactsLink.parentNode.insertBefore(vkButton, contactsLink.nextSibling);
            } else {
                desktopNav.appendChild(vkButton);
            }
        }
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav && !mobileNav.querySelector('.mobile-vk-nav-btn')) {
            const mobileVkButton = document.createElement('a');
            mobileVkButton.href = 'vk.html';
            mobileVkButton.className = 'mobile-nav-link mobile-vk-nav-btn';
            mobileVkButton.innerHTML = '<i class="fab fa-vk"></i> VK';
            mobileVkButton.style.cssText = 'background: #2c5aa0; color: white; border-radius: 8px; padding: 12px 16px; margin: 10px 0; text-align: center;';
            const mobileContactsLink = mobileNav.querySelector('a[href="contacts.html"]');
            if (mobileContactsLink) {
                mobileContactsLink.parentNode.insertBefore(mobileVkButton, mobileContactsLink.nextSibling);
            } else {
                const loginLink = mobileNav.querySelector('a[href="authorization.html"]');
                if (loginLink) {
                    mobileNav.insertBefore(mobileVkButton, loginLink);
                } else {
                    mobileNav.appendChild(mobileVkButton);
                }
            }
        }
    }

    hideVkNavigation() {
        document.querySelectorAll('.vk-nav-btn, .mobile-vk-nav-btn').forEach(btn => btn.remove());
    }

    // ========== УПРАВЛЕНИЕ ЦЕНАМИ ==========
    DEFAULT_PRICES() {
        return {
            'Стандарт': 5000,
            'Комфорт': 8000,
            'Люкс': 12000,
            'Премиум': 15000,
            'Семейный': 10000,
            'Swiss Executive Lounge': 8500,
            'Полулюкс': 4100,
            'Президентский': 12000
        };
    }

    getRoomPrices() {
        const saved = localStorage.getItem('atrium_room_prices');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Ошибка парсинга цен, используются стандартные');
            }
        }
        return this.DEFAULT_PRICES();
    }

    saveRoomPrices(prices) {
        localStorage.setItem('atrium_room_prices', JSON.stringify(prices));
        console.log('Цены сохранены');
    }

    openPriceEditor() {
        const modal = document.getElementById('priceEditorModal');
        if (!modal) {
            console.warn('Модальное окно для цен не найдено');
            return;
        }
        const prices = this.getRoomPrices();
        const container = document.getElementById('priceFields');
        if (!container) return;
        container.innerHTML = '';
        for (const [room, price] of Object.entries(prices)) {
            const div = document.createElement('div');
            div.className = 'price-field';
            div.innerHTML = `
                <label>${room}</label>
                <input type="number" class="price-input" data-room="${room}" value="${price}" min="0" step="100">
            `;
            container.appendChild(div);
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    savePricesFromModal() {
        const inputs = document.querySelectorAll('#priceFields .price-input');
        const newPrices = {};
        inputs.forEach(input => {
            const room = input.getAttribute('data-room');
            const value = parseInt(input.value, 10);
            if (room && !isNaN(value) && value >= 0) {
                newPrices[room] = value;
            }
        });
        if (Object.keys(newPrices).length === 0) {
            this.showNotification('Не удалось сохранить цены', true);
            return;
        }
        this.saveRoomPrices(newPrices);
        this.showNotification('Цены успешно обновлены!');
        const modal = document.getElementById('priceEditorModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ========== РАСЧЁТ ЦЕНЫ С ЗАЩИТОЙ ОТ ПУСТЫХ ДАТ ==========
    calculatePrice(roomName, checkin, checkout) {
        const prices = this.getRoomPrices();
        const basePrice = prices[roomName] || 5000;
        
        // Если даты не переданы, используем текущие (1 ночь)
        let nights = 1;
        if (checkin && checkout) {
            try {
                const checkinDate = new Date(checkin.split('.').reverse().join('-'));
                const checkoutDate = new Date(checkout.split('.').reverse().join('-'));
                const diff = checkoutDate - checkinDate;
                if (diff > 0) {
                    nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
                }
            } catch (e) {
                console.warn('Ошибка расчёта дней, используется 1 ночь');
            }
        }
        const total = basePrice * nights;
        return isNaN(total) ? basePrice : total;
    }

    // ========== ОТМЕНА И РЕДАКТИРОВАНИЕ БРОНИРОВАНИЙ АДМИНИСТРАТОРОМ ==========
    adminCancelBooking(bookingId) {
        if (!this.isAdmin()) {
            this.showNotification('Доступ запрещён', true);
            return;
        }
        if (!confirm('Вы уверены, что хотите отменить это бронирование?')) return;
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            localStorage.setItem('atrium_bookings', JSON.stringify(this.bookings));
            this.showNotification('Бронирование отменено администратором');
            this.updateAdminBookingsTable();
        } else {
            this.showNotification('Бронирование не найдено', true);
        }
    }

    adminOpenEditBooking(bookingId) {
        if (!this.isAdmin()) {
            this.showNotification('Доступ запрещён', true);
            return;
        }
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) {
            this.showNotification('Бронирование не найдено', true);
            return;
        }
        document.getElementById('editBookingId').value = booking.id;
        document.getElementById('editRoomType').value = booking.title;
        document.getElementById('editCheckin').value = booking.checkin || '';
        document.getElementById('editCheckout').value = booking.checkout || '';
        document.getElementById('editGuests').value = booking.guests ? parseInt(booking.guests) : 1;
        document.getElementById('editStatus').value = booking.status;
        const modal = document.getElementById('editBookingModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    adminSaveBookingChanges() {
        if (!this.isAdmin()) return;
        const bookingId = document.getElementById('editBookingId').value;
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) {
            this.showNotification('Бронирование не найдено', true);
            return;
        }
        const newTitle = document.getElementById('editRoomType').value.trim();
        const newCheckin = document.getElementById('editCheckin').value;
        const newCheckout = document.getElementById('editCheckout').value;
        const newGuests = document.getElementById('editGuests').value;
        const newStatus = document.getElementById('editStatus').value;
        if (!newTitle || !newCheckin || !newCheckout) {
            this.showNotification('Заполните все обязательные поля', true);
            return;
        }
        // Проверка дат
        const ci = new Date(newCheckin.split('.').reverse().join('-'));
        const co = new Date(newCheckout.split('.').reverse().join('-'));
        if (isNaN(ci) || isNaN(co) || ci > co) {
            this.showNotification('Дата заезда не может быть позже даты выезда', true);
            return;
        }
        booking.title = newTitle;
        booking.checkin = newCheckin;
        booking.checkout = newCheckout;
        booking.guests = newGuests;
        booking.status = newStatus;
        // Пересчёт цены
        booking.price = this.calculatePrice(newTitle, newCheckin, newCheckout);
        localStorage.setItem('atrium_bookings', JSON.stringify(this.bookings));
        this.showNotification('Бронирование обновлено!');
        const modal = document.getElementById('editBookingModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.updateAdminBookingsTable();
    }

    // ========== ОБНОВЛЕНИЕ ПРОФИЛЯ ==========
    updateProfilePage() {
        const profileSection = document.querySelector('.profile-section');
        if (!profileSection) return;
        if (!this.currentUser) {
            window.location.href = 'authorization.html';
            return;
        }
        const profileElements = {
            'profileAvatar': this.getUserInitials(),
            'profileName': `${this.currentUser.firstName} ${this.currentUser.lastName}`,
            'profileFirstName': this.currentUser.firstName,
            'profileLastName': this.currentUser.lastName,
            'profileEmail': this.currentUser.email,
            'profilePhone': this.currentUser.phone,
            'profileRole': this.currentUser.role === 'admin' ? 'Администратор' : 'Клиент',
            'profileJoinDate': `Зарегистрирован: ${new Date(this.currentUser.registrationDate).toLocaleDateString('ru-RU')}`,
            'profileNameDisplay': `${this.currentUser.firstName} ${this.currentUser.lastName}`,
            'profileRoleDisplay': this.currentUser.role === 'admin' ? 'Администратор' : 'Клиент',
            'profileJoinDateDisplay': new Date(this.currentUser.registrationDate).toLocaleDateString('ru-RU')
        };
        Object.keys(profileElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = profileElements[id];
                } else {
                    element.textContent = profileElements[id];
                }
            }
        });
        if (document.getElementById('profileBirthday') && this.currentUser.birthday) {
            document.getElementById('profileBirthday').value = this.currentUser.birthday;
        }
        this.loadUserPreferences();
        this.updateBookings();
        this.updateProfileInterface();
        this.setupProfileTabs();
        this.setupProfileEventListeners();
    }

    setupProfileTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                this.classList.add('active');
                const activeContent = document.getElementById(tabId);
                if (activeContent) activeContent.classList.add('active');

                if (tabId === 'management' && window.authManager.currentUser?.role === 'admin') {
                    window.authManager.setupProfileEventListeners();
                    setTimeout(() => {
                        window.authManager.addVkPublishButton();
                    }, 100);
                }
            });
        });
    }

    setupProfileEventListeners() {
        console.log('Setting up profile event listeners');
        const saveProfileBtn = document.querySelector('#main .btn-primary');
        if (saveProfileBtn) {
            saveProfileBtn.onclick = (e) => this.handleSaveProfile(e);
        }
        const changePasswordBtn = document.querySelector('#settings .btn-primary');
        if (changePasswordBtn) {
            changePasswordBtn.onclick = (e) => this.handleChangePassword(e);
        }
        const savePreferencesBtn = document.querySelector('#settings .btn-primary:nth-child(2)');
        if (savePreferencesBtn) {
            savePreferencesBtn.onclick = (e) => this.handleSavePreferences(e);
        }
        const priceEditBtn = document.getElementById('editPricesBtn');
        if (priceEditBtn) {
            priceEditBtn.onclick = () => this.openPriceEditor();
            console.log('Price edit button listener attached');
        } else {
            console.warn('editPricesBtn not found in DOM');
        }
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.logout();
        } else {
            this.addLogoutButton();
        }
    }

    addLogoutButton() {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn-primary';
        logoutBtn.style.cssText = 'background: #ff6b6b; color: white; border: none; margin-top: 20px;';
        logoutBtn.textContent = 'Выйти из аккаунта';
        logoutBtn.onclick = () => this.logout();
        const profileSection = document.querySelector('.profile-section');
        if (profileSection) {
            profileSection.appendChild(logoutBtn);
        }
    }

    handleSaveProfile(e) {
        e.preventDefault();
        if (!this.currentUser) return;
        const updatedUser = {
            ...this.currentUser,
            firstName: document.getElementById('profileFirstName').value || this.currentUser.firstName,
            lastName: document.getElementById('profileLastName').value || this.currentUser.lastName,
            phone: document.getElementById('profilePhone').value || this.currentUser.phone,
            email: document.getElementById('profileEmail').value || this.currentUser.email,
            birthday: document.getElementById('profileBirthday').value || this.currentUser.birthday
        };
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = updatedUser;
            localStorage.setItem('atrium_users', JSON.stringify(this.users));
        }
        this.currentUser = updatedUser;
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        this.showNotification('Профиль успешно обновлен!');
    }

    handleChangePassword(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Заполните все поля', true);
            return;
        }
        if (currentPassword !== this.currentUser.password) {
            this.showNotification('Текущий пароль неверен', true);
            return;
        }
        if (newPassword !== confirmPassword) {
            this.showNotification('Новые пароли не совпадают', true);
            return;
        }
        if (newPassword.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', true);
            return;
        }
        this.currentUser.password = newPassword;
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex].password = newPassword;
            localStorage.setItem('atrium_users', JSON.stringify(this.users));
            localStorage.setItem('current_user', JSON.stringify(this.currentUser));
        }
        this.showNotification('Пароль успешно изменен!');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    handleSavePreferences(e) {
        e.preventDefault();
        const preferences = {
            quietRoom: document.getElementById('quietRoom').checked,
            highFloor: document.getElementById('highFloor').checked,
            nonSmoking: document.getElementById('nonSmoking').checked,
            mealType: document.getElementById('mealType').value,
            specialRequests: document.getElementById('specialRequests').value
        };
        this.userPreferences[this.currentUser.id] = preferences;
        localStorage.setItem('atrium_user_prefs', JSON.stringify(this.userPreferences));
        this.showNotification('Предпочтения сохранены!');
    }

    loadUserPreferences() {
        const userPrefs = this.userPreferences[this.currentUser.id];
        if (userPrefs) {
            const quietRoomCheckbox = document.getElementById('quietRoom');
            const highFloorCheckbox = document.getElementById('highFloor');
            const nonSmokingCheckbox = document.getElementById('nonSmoking');
            const mealSelect = document.getElementById('mealType');
            const requestsTextarea = document.getElementById('specialRequests');
            if (quietRoomCheckbox) quietRoomCheckbox.checked = userPrefs.quietRoom || false;
            if (highFloorCheckbox) highFloorCheckbox.checked = userPrefs.highFloor || false;
            if (nonSmokingCheckbox) nonSmokingCheckbox.checked = userPrefs.nonSmoking || false;
            if (mealSelect) mealSelect.value = userPrefs.mealType || 'Завтрак включен';
            if (requestsTextarea) requestsTextarea.value = userPrefs.specialRequests || '';
        }
    }

    updateBookings() {
        const userBookings = this.bookings.filter(booking => booking.userId === this.currentUser.id);
        const currentBookingsContainer = document.getElementById('currentBookings');
        if (currentBookingsContainer) {
            currentBookingsContainer.innerHTML = '';
            const currentBookings = userBookings.filter(b => b.status !== 'cancelled');
            if (currentBookings.length === 0) {
                currentBookingsContainer.innerHTML = '<p>Нет текущих бронирований</p>';
            } else {
                currentBookings.forEach(booking => {
                    const bookingElement = document.createElement('div');
                    bookingElement.className = 'booking-item';
                    bookingElement.innerHTML = this.getBookingHTML(booking);
                    currentBookingsContainer.appendChild(bookingElement);
                });
            }
        }
        const historyContainer = document.getElementById('bookingHistory');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            const historyBookings = userBookings.filter(b => b.status === 'cancelled');
            if (historyBookings.length === 0) {
                historyContainer.innerHTML = '<p>Нет истории бронирований</p>';
            } else {
                historyBookings.forEach(booking => {
                    const bookingElement = document.createElement('div');
                    bookingElement.className = 'booking-item';
                    bookingElement.innerHTML = this.getBookingHTML(booking);
                    historyContainer.appendChild(bookingElement);
                });
            }
        }
    }

    getBookingHTML(booking) {
        const statusText = {
            'paid': 'Оплачено',
            'pending': 'Ожидает оплаты',
            'cancelled': 'Отменено'
        };
        const statusClass = {
            'paid': 'status-paid',
            'pending': 'status-pending',
            'cancelled': 'status-cancelled'
        };
        let detailsHTML = '';
        if (booking.type === 'room') {
            detailsHTML = `
                <div class="booking-detail">
                    <label>Дата заезда</label>
                    <span>${booking.checkin ? new Date(booking.checkin.split('.').reverse().join('-')).toLocaleDateString('ru-RU') : '-'}</span>
                </div>
                <div class="booking-detail">
                    <label>Дата выезда</label>
                    <span>${booking.checkout ? new Date(booking.checkout.split('.').reverse().join('-')).toLocaleDateString('ru-RU') : '-'}</span>
                </div>
                <div class="booking-detail">
                    <label>Гости</label>
                    <span>${booking.guests}</span>
                </div>
            `;
        } else if (booking.type === 'spa') {
            detailsHTML = `
                <div class="booking-detail">
                    <label>Дата</label>
                    <span>${booking.date ? new Date(booking.date.split('.').reverse().join('-')).toLocaleDateString('ru-RU') : '-'}</span>
                </div>
                <div class="booking-detail">
                    <label>Время</label>
                    <span>${booking.time}</span>
                </div>
                <div class="booking-detail">
                    <label>Услуга</label>
                    <span>${booking.title}</span>
                </div>
            `;
        }
        let actionsHTML = '';
        if (booking.status !== 'cancelled') {
            actionsHTML = `
                <div class="qr-code">
                    QR-код бронирования<br>
                    № ${booking.id}
                </div>
                <div class="booking-actions">
                    ${booking.status === 'pending' ? `
                        <button class="btn-small btn-primary" onclick="window.authManager.payBooking('${booking.id}')">Оплатить</button>
                        <button class="btn-small btn-outline" onclick="window.authManager.modifyBooking('${booking.id}')">Изменить</button>
                    ` : `
                        <button class="btn-small btn-outline" onclick="window.authManager.modifyBooking('${booking.id}')">Изменить бронь</button>
                        <button class="btn-small" style="background: #ff6b6b; color: white;" onclick="window.authManager.cancelBooking('${booking.id}')">Отменить бронь</button>
                        <button class="btn-small btn-primary" onclick="window.authManager.downloadVoucher('${booking.id}')">Скачать ваучер</button>
                    `}
                </div>
            `;
        }

        // Показываем цену, даже если она 0 — но если 0, значит что-то пошло не так
        const priceDisplay = booking.price > 0 ? booking.price.toLocaleString('ru-RU') + ' ₽' : 'Уточняется';

        return `
            <div class="booking-header">
                <div class="booking-title">${booking.title}</div>
                <div class="booking-status ${statusClass[booking.status]}">${statusText[booking.status]}</div>
            </div>
            <div class="booking-details">
                ${detailsHTML}
                <div class="booking-detail">
                    <label>Стоимость</label>
                    <span>${priceDisplay}</span>
                </div>
            </div>
            ${actionsHTML}
        `;
    }

    updateProfileInterface() {
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        const clientTabs = document.getElementById('clientTabs');
        const adminTabs = document.getElementById('adminTabs');
        const clientContent = document.getElementById('clientContent');
        const adminContent = document.getElementById('adminContent');
        if (clientTabs && adminTabs && clientContent && adminContent) {
            if (isAdmin) {
                clientTabs.classList.add('hidden');
                adminTabs.classList.remove('hidden');
                clientContent.classList.add('hidden');
                adminContent.classList.remove('hidden');
                this.updateAdminInterface();
                this.setupProfileEventListeners();
            } else {
                clientTabs.classList.remove('hidden');
                adminTabs.classList.add('hidden');
                clientContent.classList.remove('hidden');
                adminContent.classList.add('hidden');
            }
        }
    }

    updateAdminInterface() {
        const totalRooms = 7;
        const occupiedRooms = this.bookings.filter(b => b.type === 'room' && b.status === 'paid').length;
        const freeRooms = totalRooms - occupiedRooms;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = totalRooms;
            statNumbers[1].textContent = occupiedRooms;
            statNumbers[2].textContent = freeRooms;
            statNumbers[3].textContent = occupancyRate + '%';
        }
        this.updateAdminBookingsTable();
        this.addVkPublishButton();
    }

    updateAdminBookingsTable() {
        const tableBody = document.querySelector('#management .table tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        const parseDate = (dateStr) => {
            if (!dateStr) return '-';
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const d = new Date(`${year}-${month}-${day}`);
                if (!isNaN(d)) {
                    return d.toLocaleDateString('ru-RU');
                }
            }
            return dateStr;
        };

        this.bookings.forEach(booking => {
            const user = this.getUserById(booking.userId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${user ? `${user.firstName} ${user.lastName}` : 'Неизвестный пользователь'}</td>
                <td>${booking.title}</td>
                <td>${parseDate(booking.checkin)}</td>
                <td>${parseDate(booking.checkout)}</td>
                <td><span class="booking-status status-${booking.status}">${this.getStatusText(booking.status)}</span></td>
                <td>
                    <button class="btn-small btn-primary" onclick="window.authManager.adminOpenEditBooking('${booking.id}')">✏️ Изменить</button>
                    <button class="btn-small" style="background:#ff6b6b; color:white;" onclick="window.authManager.adminCancelBooking('${booking.id}')">🗑️ Отменить</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    getStatusText(status) {
        const statusMap = {
            'paid': 'Оплачено',
            'pending': 'Ожидает',
            'cancelled': 'Отменено'
        };
        return statusMap[status] || status;
    }

    addVkPublishButton() {
        const existingButton = document.getElementById('vkPublishBtn');
        if (existingButton) return;
        const vkButton = document.createElement('button');
        vkButton.id = 'vkPublishBtn';
        vkButton.className = 'btn-primary';
        vkButton.style.cssText = 'background: #2c5aa0; color: white; border: none; margin: 20px 0; padding: 12px 24px; display: flex; align-items: center; justify-content: center; gap: 10px;';
        vkButton.innerHTML = `
            <i class="fab fa-vk" style="font-size: 18px;"></i>
            Опубликовать в ВКонтакте
        `;
        vkButton.onclick = () => {
            window.location.href = 'vk.html';
        };
        const managementSection = document.querySelector('#management');
        if (managementSection) {
            const table = managementSection.querySelector('.table');
            if (table) {
                managementSection.insertBefore(vkButton, table);
            } else {
                managementSection.appendChild(vkButton);
            }
        }
    }

    // ========== БРОНИРОВАНИЕ ==========
    redirectToBookingPage(bookingData) {
        localStorage.setItem('pending_booking', JSON.stringify(bookingData));
        window.location.href = 'booking.html';
    }

    handleRoomBooking(roomData) {
        if (this.isAdmin()) {
            this.showNotification('Администратор не может бронировать номера', true);
            return false;
        }
        this.redirectToBookingPage(roomData);
        return true;
    }

    createBooking(bookingData, userInfo = null) {
        if (this.isAdmin() && !userInfo) {
            this.showNotification('Администратор не может бронировать для себя', true);
            return false;
        }
        // Рассчитываем цену, если не получится — ставим базовую
        let price = this.calculatePrice(bookingData.roomName, bookingData.checkin, bookingData.checkout);
        if (!price || isNaN(price) || price <= 0) {
            const prices = this.getRoomPrices();
            price = prices[bookingData.roomName] || 5000;
            console.warn('Цена не рассчиталась, использована базовая:', price);
        }
        const booking = {
            id: 'BKG-' + Date.now(),
            userId: userInfo ? userInfo.id : (this.currentUser ? this.currentUser.id : null),
            type: 'room',
            title: bookingData.roomName,
            checkin: bookingData.checkin,
            checkout: bookingData.checkout,
            guests: bookingData.guests,
            price: price,
            status: 'pending',
            createdAt: new Date().toISOString(),
            userInfo: userInfo || (this.currentUser ? {
                firstName: this.currentUser.firstName,
                lastName: this.currentUser.lastName,
                email: this.currentUser.email,
                phone: this.currentUser.phone
            } : null)
        };
        this.bookings.push(booking);
        localStorage.setItem('atrium_bookings', JSON.stringify(this.bookings));
        localStorage.removeItem('pending_booking');
        return booking;
    }

    payBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'paid';
            localStorage.setItem('atrium_bookings', JSON.stringify(this.bookings));
            this.showNotification('Бронирование оплачено!');
            this.updateProfilePage();
        }
    }

    modifyBooking(bookingId) {
        this.showNotification('Функция изменения бронирования в разработке');
    }

    cancelBooking(bookingId) {
        if (confirm('Вы уверены, что хотите отменить бронирование?')) {
            const booking = this.bookings.find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'cancelled';
                localStorage.setItem('atrium_bookings', JSON.stringify(this.bookings));
                this.showNotification('Бронирование отменено');
                this.updateProfilePage();
            }
        }
    }

    downloadVoucher(bookingId) {
        this.showNotification('Ваучер скачан успешно!');
    }

    adminModifyBooking(bookingId) {
        this.showNotification('Функция изменения бронирования администратором в разработке');
    }

    adminViewDetails(bookingId) {
        this.showNotification('Просмотр деталей бронирования');
    }

    getUserInitials() {
        if (!this.currentUser) return '';
        return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
    }

    showNotification(message, isError = false) {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getUserById(id) {
        return this.users.find(user => user.id === id);
    }

    getUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    requireAuth(redirectUrl = 'authorization.html') {
        if (!this.currentUser) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (!window.authManager) {
        window.authManager = new AuthManager();
    }
    window.authManager.init();
});

// Глобальные функции для вызова из HTML
window.openPremiumModal = function(modalType) {
    const modalId = `modal-${modalType}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.openServiceModal = function(serviceType) {
    window.openPremiumModal(serviceType);
};

window.openRoomModal = function(roomType) {
    const modalId = `modal-${roomType.toLowerCase().replace(' ', '-')}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.bookRoom = function(roomName) {
    if (!roomName) return;
    if (!window.authManager || !window.authManager.currentUser) {
        window.authManager.showNotification('Для бронирования необходимо войти в аккаунт', true);
        setTimeout(() => {
            window.location.href = 'authorization.html';
        }, 1500);
        return;
    }
    if (window.authManager.isAdmin()) {
        window.authManager.showNotification('Администратор не может бронировать номера', true);
        return;
    }
    const checkinInput = document.getElementById('checkIn');
    const checkoutInput = document.getElementById('checkOut');
    const guestsSelect = document.getElementById('guests');
    const checkin = checkinInput ? checkinInput.value : new Date().toLocaleDateString('ru-RU');
    const checkout = checkoutInput ? checkoutInput.value : new Date().toLocaleDateString('ru-RU');
    const guests = guestsSelect ? guestsSelect.options[guestsSelect.selectedIndex].text : '2 гостя';
    const bookingData = {
        roomName: roomName,
        checkin: checkin,
        checkout: checkout,
        guests: guests,
        type: 'room'
    };
    const result = window.authManager.createBooking(bookingData);
    if (result) {
        window.authManager.showNotification('Номер успешно забронирован!');
        document.querySelectorAll('.premium-modal, .room-modal, .service-modal, .swiss-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    } else {
        window.authManager.showNotification('Ошибка бронирования. Попробуйте ещё раз.', true);
    }
};

window.bookService = function(serviceName, serviceType = 'spa') {
    if (!serviceName) return;
    if (!window.authManager || !window.authManager.currentUser) {
        window.authManager.showNotification('Для бронирования необходимо войти в аккаунт', true);
        setTimeout(() => {
            window.location.href = 'authorization.html';
        }, 1500);
        return;
    }
    if (window.authManager.isAdmin()) {
        window.authManager.showNotification('Администратор не может бронировать услуги', true);
        return;
    }
    const bookingData = {
        roomName: serviceName,
        type: serviceType,
        checkin: new Date().toLocaleDateString('ru-RU'),
        checkout: new Date().toLocaleDateString('ru-RU'),
        guests: '1 человек'
    };
    const result = window.authManager.createBooking(bookingData);
    if (result) {
        window.authManager.showNotification(`Услуга "${serviceName}" успешно забронирована!`);
        document.querySelectorAll('.premium-modal, .room-modal, .service-modal, .swiss-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    } else {
        window.authManager.showNotification('Ошибка бронирования.', true);
    }
};

window.closeAllModals = function() {
    document.querySelectorAll('.premium-modal, .room-modal, .service-modal, .swiss-modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
};