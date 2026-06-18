// auth.js - Полная система авторизации для отеля "Атриум"

class AuthManager {
    constructor() {
        console.log('AuthManager constructor called');
        
        // Проверяем, не был ли уже инициализирован AuthManager
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
        
        // Сохраняем экземпляр в глобальной области видимости
        window.authManager = this;
        console.log('AuthManager создан успешно');
    }

    init() {
        console.log('AuthManager init called');
        this.checkAuthState();
        this.setupEventListeners();
        console.log('AuthManager инициализирован');
    }

    // Инициализация тестовых аккаунтов
    initTestAccounts() {
        const testAccounts = [
            {
                id: 1,
                firstName: 'Администратор',
                lastName: 'гостиницы',
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

        // Добавляем тестовые аккаунты если их нет в базе
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

    // Инициализация тестовых бронирований
    initTestBookings() {
        if (this.bookings.length === 0) {
            this.bookings = [
                {
                    id: 'BKG-2024-001',
                    userId: 2,
                    type: 'room',
                    title: 'Люкс с видом на море',
                    checkin: '2024-11-15',
                    checkout: '2024-11-18',
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
                    date: '2024-11-16',
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
                    checkin: '2024-10-01',
                    checkout: '2024-10-05',
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
        
        // Обработка кнопки входа в десктопном меню
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Login button clicked, current user:', this.currentUser);
                
                if (this.currentUser) {
                    window.location.href = 'profile.html';
                } else {
                    window.location.href = 'authorization.html';
                }
            });
        }

        // Обработка мобильного меню
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
            console.log('User found:', user);
            this.login(user);
            this.showNotification('Вход выполнен успешно!');
            return true;
        } else {
            console.log('User not found with email:', email);
            this.showNotification('Неверный email или пароль', true);
            return false;
        }
    }

    handleRegister(userData) {
        console.log('Register attempt with data:', userData);
        
        // Проверка на существующего пользователя
        if (this.users.find(u => u.email === userData.email)) {
            this.showNotification('Пользователь с таким email уже существует', true);
            return false;
        }

        // Валидация email
        if (!this.validateEmail(userData.email)) {
            this.showNotification('Введите корректный email', true);
            return false;
        }

        // Валидация пароля (минимум 6 символов)
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
        console.log('Logging in user:', user);
        this.currentUser = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        this.updateUI();
    }

    logout() {
        console.log('Logging out');
        this.currentUser = null;
        localStorage.removeItem('current_user');
        this.updateUI();
        this.showNotification('Вы вышли из аккаунта');
        
        // Перенаправляем на главную страницу если мы на странице профиля
        if (window.location.pathname.includes('profile.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    checkAuthState() {
        console.log('Checking auth state');
        const savedUser = localStorage.getItem('current_user');
        console.log('Saved user from localStorage:', savedUser);
        
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('Current user set to:', this.currentUser);
            } catch (e) {
                console.error('Ошибка при загрузке пользователя:', e);
                localStorage.removeItem('current_user');
            }
        } else {
            console.log('No saved user found');
        }
        
        this.updateUI();
    }

    updateUI() {
        console.log('Updating UI, current user:', this.currentUser);
        const loginBtn = document.getElementById('loginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        
        console.log('Login button found:', !!loginBtn);
        console.log('Mobile login button found:', !!mobileLoginBtn);
        
        if (this.currentUser) {
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <div class="user-profile">
                        <div class="user-avatar">${this.getUserInitials()}</div>
                        <span class="user-name">${this.currentUser.firstName}</span>
                    </div>
                `;
                loginBtn.classList.add('user-profile-btn');
                console.log('Desktop login button updated with user profile');
            }

            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `
                    <div class="user-profile">
                        <div class="user-avatar">${this.getUserInitials()}</div>
                        <span class="user-name">${this.currentUser.firstName}</span>
                    </div>
                `;
                mobileLoginBtn.classList.add('user-profile-btn');
                console.log('Mobile login button updated with user profile');
            }
            // Обновляем новую мобильную ссылку (в меню с иконками)
            const mobileLoginLink = document.querySelector('.mobile-nav-link[href="authorization.html"]');
            if (mobileLoginLink) {
                if (this.currentUser) {
                    mobileLoginLink.innerHTML = `👤 ${this.currentUser.firstName}`;
                    mobileLoginLink.href = 'profile.html';   // ссылка на личный кабинет
                } else {
                    mobileLoginLink.innerHTML = '🔐 Войти';
                    mobileLoginLink.href = 'authorization.html';
                }
                }
            this.updateVkNavigation();

        } else {
            if (loginBtn) {
                loginBtn.innerHTML = 'Войти';
                loginBtn.classList.remove('user-profile-btn');
                console.log('Desktop login button reset to "Войти"');
            }

            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = 'Войти';
                mobileLoginBtn.classList.remove('user-profile-btn');
                console.log('Mobile login button reset to "Войти"');
            }

            this.hideVkNavigation();
        }
        
        if (window.location.pathname.includes('profile.html')) {
            console.log('We are on profile page, updating profile...');
            this.updateProfilePage();
        }
    }

    updateVkNavigation() {
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        console.log('Updating VK navigation, is admin:', isAdmin);
        
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
            console.log('VK button added to desktop navigation');
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
            console.log('VK button added to mobile navigation');
        }
    }

    hideVkNavigation() {
        const vkButtons = document.querySelectorAll('.vk-nav-btn, .mobile-vk-nav-btn');
        vkButtons.forEach(btn => {
            btn.remove();
        });
        console.log('VK navigation buttons removed');
    }

    updateProfilePage() {
        console.log('=== updateProfilePage called ===');
        
        const profileSection = document.querySelector('.profile-section');
        console.log('Profile section found:', !!profileSection);
        
        if (!profileSection) {
            console.log('Not on profile page, skipping updateProfilePage');
            return;
        }
        
        if (!this.currentUser) {
            console.log('No current user, redirecting to login');
            window.location.href = 'authorization.html';
            return;
        }
        
        console.log('Updating profile page for user:', this.currentUser);
        
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

        console.log('Profile elements to update:', profileElements);

        Object.keys(profileElements).forEach(id => {
            const element = document.getElementById(id);
            console.log(`Element ${id} found:`, !!element);
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = profileElements[id];
                } else {
                    element.textContent = profileElements[id];
                }
                console.log(`Element ${id} updated to:`, profileElements[id]);
            }
        });

        if (document.getElementById('profileBirthday') && this.currentUser.birthday) {
            document.getElementById('profileBirthday').value = this.currentUser.birthday;
            console.log('Birthday field updated to:', this.currentUser.birthday);
        }

        this.loadUserPreferences();
        this.updateBookings();
        this.updateProfileInterface();
        this.setupProfileTabs();
        this.setupProfileEventListeners();

        console.log('=== Profile page update complete ===');
    }

    setupProfileTabs() {
        console.log('Setting up profile tabs');
        const tabButtons = document.querySelectorAll('.tab-btn');
        console.log('Found tab buttons:', tabButtons.length);
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                console.log('Tab clicked:', tabId);
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                this.classList.add('active');
                const activeContent = document.getElementById(tabId);
                if (activeContent) {
                    activeContent.classList.add('active');
                }
                
                if (tabId === 'management' && window.authManager.currentUser?.role === 'admin') {
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
            console.log('Profile save button listener set');
        }

        const changePasswordBtn = document.querySelector('#settings .btn-primary');
        if (changePasswordBtn) {
            changePasswordBtn.onclick = (e) => this.handleChangePassword(e);
            console.log('Password change button listener set');
        }

        const savePreferencesBtn = document.querySelector('#settings .btn-primary:nth-child(2)');
        if (savePreferencesBtn) {
            savePreferencesBtn.onclick = (e) => this.handleSavePreferences(e);
            console.log('Preferences save button listener set');
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) {
            this.addLogoutButton();
        } else {
            logoutBtn.onclick = () => this.logout();
        }
    }

    addLogoutButton() {
        console.log('Adding logout button to profile page');
        
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn-primary';
        logoutBtn.style.cssText = 'background: #ff6b6b; color: white; border: none; margin-top: 20px;';
        logoutBtn.textContent = 'Выйти из аккаунта';
        logoutBtn.onclick = () => this.logout();
        
        const profileSection = document.querySelector('.profile-section');
        if (profileSection) {
            profileSection.appendChild(logoutBtn);
            console.log('Logout button added to profile page');
        }
    }

    handleSaveProfile(e) {
        e.preventDefault();
        console.log('Saving profile');
        
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
        console.log('Changing password');
        
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
        console.log('Saving preferences');
        
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
        console.log('Loading user preferences');
        const userPrefs = this.userPreferences[this.currentUser.id];
        console.log('User preferences found:', userPrefs);
        
        if (userPrefs) {
            const quietRoomCheckbox = document.getElementById('quietRoom');
            const highFloorCheckbox = document.getElementById('highFloor');
            const nonSmokingCheckbox = document.getElementById('nonSmoking');
            const mealSelect = document.getElementById('mealType');
            const requestsTextarea = document.getElementById('specialRequests');

            console.log('Preference elements found:', {
                quietRoomCheckbox: !!quietRoomCheckbox,
                highFloorCheckbox: !!highFloorCheckbox,
                nonSmokingCheckbox: !!nonSmokingCheckbox,
                mealSelect: !!mealSelect,
                requestsTextarea: !!requestsTextarea
            });

            if (quietRoomCheckbox) quietRoomCheckbox.checked = userPrefs.quietRoom || false;
            if (highFloorCheckbox) highFloorCheckbox.checked = userPrefs.highFloor || false;
            if (nonSmokingCheckbox) nonSmokingCheckbox.checked = userPrefs.nonSmoking || false;
            if (mealSelect) mealSelect.value = userPrefs.mealType || 'Завтрак включен';
            if (requestsTextarea) requestsTextarea.value = userPrefs.specialRequests || '';
        }
    }

    updateBookings() {
        console.log('Updating bookings');
        const userBookings = this.bookings.filter(booking => booking.userId === this.currentUser.id);
        console.log('User bookings found:', userBookings.length);
        
        const currentBookingsContainer = document.getElementById('currentBookings');
        console.log('Current bookings container found:', !!currentBookingsContainer);
        
        if (currentBookingsContainer) {
            currentBookingsContainer.innerHTML = '';
            
            const currentBookings = userBookings.filter(b => b.status !== 'cancelled');
            console.log('Current bookings to show:', currentBookings.length);
            
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
        console.log('History container found:', !!historyContainer);
        
        if (historyContainer) {
            historyContainer.innerHTML = '';
            
            const historyBookings = userBookings.filter(b => b.status === 'cancelled');
            console.log('History bookings to show:', historyBookings.length);
            
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
                    <span>${new Date(booking.checkin).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="booking-detail">
                    <label>Дата выезда</label>
                    <span>${new Date(booking.checkout).toLocaleDateString('ru-RU')}</span>
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
                    <span>${new Date(booking.date).toLocaleDateString('ru-RU')}</span>
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

        return `
            <div class="booking-header">
                <div class="booking-title">${booking.title}</div>
                <div class="booking-status ${statusClass[booking.status]}">${statusText[booking.status]}</div>
            </div>
            <div class="booking-details">
                ${detailsHTML}
                <div class="booking-detail">
                    <label>Стоимость</label>
                    <span>${booking.price.toLocaleString('ru-RU')} ₽</span>
                </div>
            </div>
            ${actionsHTML}
        `;
    }

    updateProfileInterface() {
        console.log('Updating profile interface');
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        console.log('Is admin:', isAdmin);
        
        const clientTabs = document.getElementById('clientTabs');
        const adminTabs = document.getElementById('adminTabs');
        const clientContent = document.getElementById('clientContent');
        const adminContent = document.getElementById('adminContent');

        console.log('Interface elements found:', {
            clientTabs: !!clientTabs,
            adminTabs: !!adminTabs,
            clientContent: !!clientContent,
            adminContent: !!adminContent
        });

        if (clientTabs && adminTabs && clientContent && adminContent) {
            if (isAdmin) {
                clientTabs.classList.add('hidden');
                adminTabs.classList.remove('hidden');
                clientContent.classList.add('hidden');
                adminContent.classList.remove('hidden');
                this.updateAdminInterface();
                console.log('Admin interface shown');
            } else {
                clientTabs.classList.remove('hidden');
                adminTabs.classList.add('hidden');
                clientContent.classList.remove('hidden');
                adminContent.classList.add('hidden');
                console.log('Client interface shown');
            }
        }
    }

    updateAdminInterface() {
        console.log('Updating admin interface');
        const totalRooms = 24;
        const occupiedRooms = this.bookings.filter(b => b.type === 'room' && b.status === 'paid').length;
        const freeRooms = totalRooms - occupiedRooms;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        const statNumbers = document.querySelectorAll('.stat-number');
        console.log('Stat number elements found:', statNumbers.length);
        
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = totalRooms;
            statNumbers[1].textContent = occupiedRooms;
            statNumbers[2].textContent = freeRooms;
            statNumbers[3].textContent = occupancyRate + '%';
            console.log('Admin stats updated');
        }

        this.updateAdminBookingsTable();
        this.addVkPublishButton();
    }

    addVkPublishButton() {
        console.log('Adding VK publish button for admin');
        
        const existingButton = document.getElementById('vkPublishBtn');
        if (existingButton) {
            console.log('VK button already exists');
            return;
        }

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
            console.log('VK publish button added to admin interface');
        } else {
            console.log('Management section not found for VK button');
        }
    }

    updateAdminBookingsTable() {
        console.log('Updating admin bookings table');
        const tableBody = document.querySelector('#management .table tbody');
        console.log('Table body found:', !!tableBody);
        
        if (!tableBody) return;

        tableBody.innerHTML = '';

        this.bookings.forEach(booking => {
            const user = this.getUserById(booking.userId);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${user ? `${user.firstName} ${user.lastName}` : 'Неизвестный пользователь'}</td>
                <td>${booking.title}</td>
                <td>${booking.checkin ? new Date(booking.checkin).toLocaleDateString('ru-RU') : '-'}</td>
                <td>${booking.checkout ? new Date(booking.checkout).toLocaleDateString('ru-RU') : '-'}</td>
                <td><span class="booking-status status-${booking.status}">${this.getStatusText(booking.status)}</span></td>
                <td>
                    <button class="btn-small btn-outline" onclick="window.authManager.adminModifyBooking('${booking.id}')">Изменить</button>
                    <button class="btn-small" onclick="window.authManager.adminViewDetails('${booking.id}')">Детали</button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        console.log('Admin bookings table updated with', this.bookings.length, 'bookings');
    }

    getStatusText(status) {
        const statusMap = {
            'paid': 'Оплачено',
            'pending': 'Ожидает',
            'cancelled': 'Отменено'
        };
        return statusMap[status] || status;
    }

    // НОВЫЙ МЕТОД: Перенаправление на страницу бронирования
    redirectToBookingPage(bookingData) {
        console.log('Redirecting to booking page with data:', bookingData);
        
        // Сохраняем данные бронирования в localStorage для использования на странице booking.html
        localStorage.setItem('pending_booking', JSON.stringify(bookingData));
        
        // Перенаправляем на страницу бронирования
        window.location.href = 'booking.html';
    }

    // ИЗМЕНЕНО: Теперь вместо создания бронирования перенаправляем на booking.html
    handleRoomBooking(roomData) {
        this.redirectToBookingPage(roomData);
        return true;
    }

    // Метод для создания бронирования (используется на странице booking.html)
    createBooking(bookingData, userInfo = null) {
        const booking = {
            id: 'BKG-' + Date.now(),
            userId: userInfo ? userInfo.id : (this.currentUser ? this.currentUser.id : null),
            type: 'room',
            title: bookingData.roomName,
            checkin: bookingData.checkin,
            checkout: bookingData.checkout,
            guests: bookingData.guests,
            price: this.calculatePrice(bookingData.roomName, bookingData.checkin, bookingData.checkout),
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
        
        // Удаляем отложенное бронирование из localStorage
        localStorage.removeItem('pending_booking');
        
        return booking;
    }

    calculatePrice(roomName, checkin, checkout) {
        const basePrices = {
            'Стандарт': 5000,
            'Комфорт': 8000,
            'Люкс': 12000,
            'Премиум': 15000,
            'Семейный': 10000
        };
        
        const basePrice = basePrices[roomName] || 5000;
        
        const checkinDate = new Date(checkin.split('.').reverse().join('-'));
        const checkoutDate = new Date(checkout.split('.').reverse().join('-'));
        const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        
        return basePrice * nights;
    }

    payBooking(bookingId) {
        console.log('Paying booking:', bookingId);
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

    // Метод для проверки авторизации на защищенных страницах
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
    console.log('=== DOMContentLoaded - AuthManager initialization ===');
    if (!window.authManager) {
        console.log('Creating new AuthManager instance');
        window.authManager = new AuthManager();
    }
    window.authManager.init();
    console.log('=== AuthManager initialization complete ===');
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

// ИЗМЕНЕНО: Теперь при нажатии "Забронировать" перенаправляем на booking.html
window.bookRoom = function(roomName) {
    if (!roomName) {
        console.error('Room name is required');
        return;
    }

    // Если пользователь не авторизован – перенаправляем на страницу входа
    if (!window.authManager || !window.authManager.currentUser) {
        window.authManager.showNotification('Для бронирования необходимо войти в аккаунт', true);
        setTimeout(() => {
            window.location.href = 'authorization.html';
        }, 1500);
        return;
    }

    // Получаем даты из формы (если они есть на странице)
    const checkinInput = document.getElementById('checkIn');
    const checkoutInput = document.getElementById('checkOut');
    const guestsSelect = document.getElementById('guests');
    const checkin = checkinInput ? checkinInput.value : new Date().toLocaleDateString('ru-RU');
    const checkout = checkoutInput ? checkoutInput.value : new Date().toLocaleDateString('ru-RU');
    const guests = guestsSelect ? guestsSelect.options[guestsSelect.selectedIndex].text : '2 гостя';

    // Формируем данные
    const bookingData = {
        roomName: roomName,
        checkin: checkin,
        checkout: checkout,
        guests: guests,
        type: 'room'
    };

    // Создаём бронирование через AuthManager
    const result = window.authManager.createBooking(bookingData);

    if (result) {
        window.authManager.showNotification('Номер успешно забронирован!');
        // Закрываем все модальные окна
        document.querySelectorAll('.premium-modal, .room-modal, .service-modal, .swiss-modal').forEach(modal => {
            modal.classList.remove('active');
        });
        // Опционально: перенаправить в профиль через пару секунд
        // setTimeout(() => { window.location.href = 'profile.html'; }, 2000);
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

    const bookingData = {
        roomName: serviceName, // используем поле roomName как название услуги
        type: serviceType,     // 'spa' или 'conference'
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
        // setTimeout(() => { window.location.href = 'profile.html'; }, 2000);
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
