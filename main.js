document.addEventListener('DOMContentLoaded', () => {
    // ========== ГЛОБАЛЬНІ ДАНІ ==========
    let currentUser = null;
    let cards = [];
    let activeCardIndex = 0;
    let isBalanceHidden = false;
    let skin = 'green';
    let language = 'uk';
    let currentFilter = 'all';
    let exchangeRates = null;

    const skins = ['green', 'blue', 'red', 'purple', 'gold', 'silver', 'cyan', 'cosmic'];

    // ========== ЕЛЕМЕНТИ DOM ==========
    const authScreen = document.getElementById('auth-screen');
    const appMain = document.getElementById('app-main');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form-container');
    const registerForm = document.getElementById('register-form-container');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    const modalClose = document.querySelector('.modal-close');
    const cardSelector = document.getElementById('cardSelector');
    const historyFilterType = document.getElementById('historyFilterType');
    const profileNameSpan = document.getElementById('profileName');
    const profileEmailSpan = document.getElementById('profileEmail');

    // ========== ДОПОМІЖНІ ФУНКЦІЇ ==========
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone);
    }

    // Збереження / завантаження даних
    function saveUsers(users) {
        localStorage.setItem('monoUsers', JSON.stringify(users));
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem('monoUsers')) || [];
    }

    function saveSession(email) {
        if (email) localStorage.setItem('monoSession', email);
        else localStorage.removeItem('monoSession');
    }

    function saveUISettings() {
        localStorage.setItem('monoUISettings', JSON.stringify({
            activeCardIndex,
            isBalanceHidden,
            skin,
            language
        }));
    }

    function loadUISettings() {
        const saved = localStorage.getItem('monoUISettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                activeCardIndex = settings.activeCardIndex || 0;
                isBalanceHidden = settings.isBalanceHidden || false;
                skin = settings.skin || 'green';
                language = settings.language || 'uk';
            } catch (e) {}
        }
        document.getElementById('app-main').classList.toggle('balance-hidden', isBalanceHidden);
        const eyeIcon = document.getElementById('eyeIcon');
        if (eyeIcon) eyeIcon.className = isBalanceHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
        applySkin();
    }

    function updateUserInStorage() {
        if (!currentUser) return;
        if (currentUser.email === 'demo@mail.com') {
            localStorage.setItem('monoDemoUser', JSON.stringify(currentUser));
            return;
        }
        const users = getUsers();
        const index = users.findIndex(u => u.email === currentUser.email);
        if (index !== -1) {
            users[index] = currentUser;
            saveUsers(users);
        }
    }

    function loadSession() {
        const sessionEmail = localStorage.getItem('monoSession');
        if (!sessionEmail) return false;

        if (sessionEmail === 'demo@mail.com') {
            const savedDemo = localStorage.getItem('monoDemoUser');
            if (savedDemo) {
                currentUser = JSON.parse(savedDemo);
            } else {
                currentUser = createDemoUser();
            }
            cards = currentUser.cards;
            return true;
        }

        const users = getUsers();
        const user = users.find(u => u.email === sessionEmail);
        if (user) {
            currentUser = user;
            cards = currentUser.cards;
            return true;
        }
        return false;
    }

    function createDemoUser() {
        return {
            name: 'Іван Іваненко',
            email: 'demo@mail.com',
            phone: '+380 67 123 45 67',
            cards: [{
                id: 'card1',
                number: '5375 41•• •••• 1234',
                holder: 'ІВАН ІВАНЕНКО',
                expiry: '09/25',
                balance: 15240.75,
                transactions: [
                    { id: 't1', icon: 'fa-briefcase', name: 'Зарплата', date: new Date(2025, 2, 14, 18, 2), amount: 22500, type: 'positive' },
                    { id: 't2', icon: 'fa-store', name: 'АТБ', date: new Date(2025, 2, 16, 12, 45), amount: -328.5, type: 'negative' },
                    { id: 't3', icon: 'fa-wifi', name: 'Поповнення телефону', date: new Date(2025, 2, 15, 9, 20), amount: -100, type: 'negative' },
                    { id: 't4', icon: 'fa-gas-pump', name: 'АЗК WOG', date: new Date(2025, 2, 17, 15, 30), amount: -850, type: 'negative' },
                    { id: 't5', icon: 'fa-utensils', name: 'Ресторан', date: new Date(2025, 2, 18, 20, 0), amount: -450, type: 'negative' }
                ]
            }, {
                id: 'card2',
                number: '5168 75•• •••• 9876',
                holder: 'ІВАН ІВАНЕНКО',
                expiry: '12/26',
                balance: 5000.00,
                transactions: [
                    { id: 't6', icon: 'fa-shopping-cart', name: 'Rozetka', date: new Date(2025, 2, 10, 14, 0), amount: -1250, type: 'negative' }
                ]
            }],
            loans: [
                { id: 'auto', name: 'Автокредит', balance: 125000, total: 250000, rate: 12 }
            ]
        };
    }

    // ========== UI ФУНКЦІЇ ==========
    function showInfoModal(title, message) {
        modalTitle.innerText = title;
        modalBody.innerHTML = `<p style="color:white;">${message}</p>`;
        modalFooter.innerHTML = `<button class="modal-btn-primary" id="infoOkBtn">OK</button>`;
        modal.classList.add('show');
        document.getElementById('infoOkBtn').addEventListener('click', () => modal.classList.remove('show'), { once: true });
    }

    function showModal(title, body, showConfirm = true, confirmCallback = null, showCancel = true) {
        modalTitle.innerText = title;
        modalBody.innerHTML = body;
        modalFooter.innerHTML = '';
        if (showConfirm) {
            const confirmBtn = document.createElement('button');
            confirmBtn.innerText = 'Підтвердити';
            confirmBtn.className = 'modal-btn-primary';
            confirmBtn.addEventListener('click', () => {
                if (confirmCallback) confirmCallback();
                modal.classList.remove('show');
            });
            modalFooter.appendChild(confirmBtn);
        }
        if (showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.innerText = 'Скасувати';
            cancelBtn.className = 'modal-btn-secondary';
            cancelBtn.addEventListener('click', () => modal.classList.remove('show'));
            modalFooter.appendChild(cancelBtn);
        }
        modal.classList.add('show');
    }

    function formatBalance(amount) {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ') + ' ₴';
    }

    function formatDate(date) {
        if (!(date instanceof Date)) date = new Date(date);
        const months = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    function calculateMonthlyStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        let income = 0, expense = 0;
        
        cards[activeCardIndex]?.transactions?.forEach(t => {
            const txDate = new Date(t.date);
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                if (t.amount > 0) income += t.amount;
                else expense += Math.abs(t.amount);
            }
        });
        
        document.getElementById('monthlySpending').innerText = formatBalance(expense);
        document.getElementById('monthlyIncome').innerText = formatBalance(income);
    }

    function updateCardUI() {
        if (!cards.length) return;
        const card = cards[activeCardIndex];
        document.getElementById('cardNumber').innerText = card.number;
        document.getElementById('cardHolder').innerText = card.holder;
        document.getElementById('cardExpiry').innerText = card.expiry;
        document.getElementById('mainBalance').innerText = formatBalance(card.balance);
        
        cardSelector.innerHTML = '';
        cards.forEach((c, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = `${c.number} (${formatBalance(c.balance)})`;
            if (idx === activeCardIndex) option.selected = true;
            cardSelector.appendChild(option);
        });
        
        calculateMonthlyStats();
        renderHistory();
        saveUISettings();
    }

    function addTransaction(type, amount, description) {
        const card = cards[activeCardIndex];
        if (!card.transactions) card.transactions = [];
        const transaction = {
            id: Date.now().toString(),
            icon: amount > 0 ? 'fa-briefcase' : 'fa-shopping-cart',
            name: description,
            date: new Date(),
            amount: amount,
            type: amount > 0 ? 'positive' : 'negative'
        };
        card.transactions.unshift(transaction);
        card.balance += amount;
        updateCardUI();
        updateUserInStorage();
    }

    function renderHistory() {
        const list = document.getElementById('historyList');
        const card = cards[activeCardIndex];
        let transactions = card.transactions || [];
        
        if (currentFilter !== 'all') {
            transactions = transactions.filter(t => 
                currentFilter === 'income' ? t.amount > 0 : t.amount < 0
            );
        }
        
        if (transactions.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:40px;color:#8a9fb0;">Немає операцій</div>';
            return;
        }
        
        let html = '<ul class="transactions-list">';
        transactions.forEach(t => {
            html += `
                <li class="transaction-item">
                    <i class="fas ${t.icon}"></i>
                    <div class="trans-desc">
                        <span class="trans-name">${t.name}</span>
                        <span class="trans-date">${formatDate(t.date)}</span>
                    </div>
                    <span class="trans-amount ${t.type}">${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)} ₴</span>
                </li>
            `;
        });
        html += '</ul>';
        list.innerHTML = html;
    }

    function applySkin() {
        const appMainEl = document.getElementById('app-main');
        skins.forEach(s => appMainEl.classList.remove(`card-skin-${s}`));
        appMainEl.classList.add(`card-skin-${skin}`);
    }

    function applyLanguage() {
        // Спрощена реалізація для основних елементів
        const elements = {
            'appName': 'monobank'
        };
    }

    function showPage(pageId) {
        const pages = { home: 'page-home', history: 'page-history', services: 'page-services', settings: 'page-settings' };
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pages[pageId]).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
        if (pageId === 'history') renderHistory();
        if (pageId === 'home') calculateMonthlyStats();
    }

    // ========== ОБРОБНИКИ ПОДІЙ ==========
    function showAuthTab(tab) {
        loginTab.classList.toggle('active', tab === 'login');
        registerTab.classList.toggle('active', tab === 'register');
        loginForm.classList.toggle('active', tab === 'login');
        registerForm.classList.toggle('active', tab === 'register');
    }

    // Реєстрація
    registerBtn.addEventListener('click', () => {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirm = document.getElementById('reg-confirm').value.trim();
        
        if (!name || !email || !phone || !password) {
            showInfoModal('Помилка', 'Заповніть всі поля');
            return;
        }
        if (!isValidEmail(email)) {
            showInfoModal('Помилка', 'Введіть коректний email');
            return;
        }
        if (!isValidPhone(phone)) {
            showInfoModal('Помилка', 'Введіть коректний номер телефону');
            return;
        }
        if (password !== confirm) {
            showInfoModal('Помилка', 'Паролі не співпадають');
            return;
        }
        
        let users = getUsers();
        if (users.find(u => u.email === email)) {
            showInfoModal('Помилка', 'Користувач вже існує');
            return;
        }
        
        const newCard = {
            id: Date.now().toString(),
            number: `5375 41•• •••• ${Math.floor(Math.random() * 10000)}`,
            holder: name.toUpperCase(),
            expiry: '09/26',
            balance: 1000.00,
            transactions: []
        };
        
        const newUser = { 
            name, email, phone, password, 
            cards: [newCard],
            loans: []
        };
        users.push(newUser);
        saveUsers(users);
        showInfoModal('Успіх', 'Реєстрація успішна! Тепер увійдіть');
        showAuthTab('login');
    });

    // Вхід
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        if (!email || !password) {
            showInfoModal('Помилка', 'Введіть email та пароль');
            return;
        }
        
        if (email === 'demo@mail.com' && password === '123456') {
            const savedDemo = localStorage.getItem('monoDemoUser');
            if (savedDemo) {
                currentUser = JSON.parse(savedDemo);
            } else {
                currentUser = createDemoUser();
            }
        } else {
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) {
                showInfoModal('Помилка', 'Невірний email або пароль');
                return;
            }
            currentUser = user;
        }
        
        cards = currentUser.cards;
        if (activeCardIndex >= cards.length) activeCardIndex = 0;
        
        // Оновлення профілю
        if (profileNameSpan) profileNameSpan.innerText = currentUser.name;
        if (profileEmailSpan) profileEmailSpan.innerText = currentUser.email;
        
        updateCardUI();
        authScreen.classList.remove('active');
        appMain.classList.add('active');
        showPage('home');
        saveSession(currentUser.email);
    });

    // Вихід
    function logout() {
        appMain.classList.remove('active');
        authScreen.classList.add('active');
        showAuthTab('login');
        saveSession(null);
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    }
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
    const logoutBtnSide = document.getElementById('logoutBtnSide');
    if (logoutBtnSide) logoutBtnSide.addEventListener('click', logout);

    // Навігація
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => showPage(item.dataset.page));
    });

    // Фільтр історії
    if (historyFilterType) {
        historyFilterType.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderHistory();
        });
    }

    // Перемикання видимості балансу
    document.getElementById('toggleBalanceEye')?.addEventListener('click', () => {
        isBalanceHidden = !isBalanceHidden;
        document.getElementById('app-main').classList.toggle('balance-hidden', isBalanceHidden);
        const eyeIcon = document.getElementById('eyeIcon');
        if (eyeIcon) eyeIcon.className = isBalanceHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
        saveUISettings();
    });

    // Селектор карток
    cardSelector.addEventListener('change', (e) => {
        activeCardIndex = parseInt(e.target.value);
        updateCardUI();
        saveUISettings();
    });

    // ========== ДІЇ ==========
    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        
        switch (action) {
            case 'goto-history':
                showPage('history');
                break;
            case 'add-card':
                showModal('Додати картку', `
                    <p style="color:white;margin-bottom:10px;">Введіть дані нової картки</p>
                    <input class="modal-input" id="newCardNumber" placeholder="Номер картки" value="5355 1234 5678 9012">
                    <input class="modal-input" id="newCardHolder" placeholder="Власник" value="${currentUser?.name?.toUpperCase() || 'НОВИЙ КОРИСТУВАЧ'}">
                    <input class="modal-input" id="newCardExpiry" placeholder="Термін" value="12/28">
                    <input class="modal-input" id="newCardBalance" type="number" placeholder="Баланс" value="0">
                `, true, () => {
                    const newCard = {
                        id: Date.now().toString(),
                        number: document.getElementById('newCardNumber').value,
                        holder: document.getElementById('newCardHolder').value.toUpperCase(),
                        expiry: document.getElementById('newCardExpiry').value,
                        balance: parseFloat(document.getElementById('newCardBalance').value) || 0,
                        transactions: []
                    };
                    cards.push(newCard);
                    activeCardIndex = cards.length - 1;
                    updateCardUI();
                    updateUserInStorage();
                    showInfoModal('Успіх', 'Картку додано!');
                });
                break;
            case 'view-balance':
                showModal('Баланс', `<p style="font-size:28px;text-align:center;">${formatBalance(cards[activeCardIndex].balance)}</p>`);
                break;
            case 'print-balance':
                showModal('Друк виписки', `<p>Виписка за поточний місяць надіслана на email: ${currentUser?.email}</p>`);
                break;
            case 'export-csv':
                showInfoModal('Експорт', 'Виписку експортовано у CSV формат');
                break;
            case 'withdraw':
                showModal('Зняття готівки', '<input class="modal-input" id="withdrawSum" placeholder="Сума" type="number" step="0.01">', true, () => {
                    const sum = parseFloat(document.getElementById('withdrawSum')?.value);
                    if (isNaN(sum) || sum <= 0) {
                        showInfoModal('Помилка', 'Введіть коректну суму');
                        return;
                    }
                    if (sum > cards[activeCardIndex].balance) {
                        showInfoModal('Помилка', 'Недостатньо коштів');
                        return;
                    }
                    addTransaction('expense', -sum, 'Зняття готівки');
                    showInfoModal('Успіх', `Знято ${sum.toFixed(2)} грн`);
                });
                break;
            case 'topup-card':
                showModal('Поповнення карти', '<input class="modal-input" id="topupSum" placeholder="Сума" type="number" step="0.01">', true, () => {
                    const sum = parseFloat(document.getElementById('topupSum')?.value);
                    if (isNaN(sum) || sum <= 0) {
                        showInfoModal('Помилка', 'Введіть коректну суму');
                        return;
                    }
                    addTransaction('income', sum, 'Поповнення карти');
                    showInfoModal('Успіх', `Карту поповнено на ${sum.toFixed(2)} грн`);
                });
                break;
            case 'transfer':
                showModal('Переказ коштів', `
                    <input class="modal-input" placeholder="Отримувач (IBAN або телефон)">
                    <input class="modal-input" id="transferSum" placeholder="Сума" type="number" step="0.01">
                    <input class="modal-input" placeholder="Коментар (необов'язково)">
                `, true, () => {
                    const sum = parseFloat(document.getElementById('transferSum')?.value);
                    if (isNaN(sum) || sum <= 0) {
                        showInfoModal('Помилка', 'Введіть коректну суму');
                        return;
                    }
                    if (sum > cards[activeCardIndex].balance) {
                        showInfoModal('Помилка', 'Недостатньо коштів');
                        return;
                    }
                    addTransaction('expense', -sum, 'Переказ коштів');
                    showInfoModal('Успіх', 'Переказ виконано успішно');
                });
                break;
            case 'topup-phone':
                showModal('Поповнення телефону', `
                    <input class="modal-input" id="phoneNumber" placeholder="Номер телефону" value="+380">
                    <input class="modal-input" id="phoneSum" placeholder="Сума" type="number" step="0.01">
                `, true, () => {
                    const sum = parseFloat(document.getElementById('phoneSum')?.value);
                    const phone = document.getElementById('phoneNumber')?.value;
                    if (!phone || phone.length < 10) {
                        showInfoModal('Помилка', 'Введіть коректний номер телефону');
                        return;
                    }
                    if (isNaN(sum) || sum <= 0) {
                        showInfoModal('Помилка', 'Введіть коректну суму');
                        return;
                    }
                    if (sum > cards[activeCardIndex].balance) {
                        showInfoModal('Помилка', 'Недостатньо коштів');
                        return;
                    }
                    addTransaction('expense', -sum, `Поповнення телефону ${phone}`);
                    showInfoModal('Успіх', `Телефон ${phone} поповнено на ${sum.toFixed(2)} грн`);
                });
                break;
            case 'pay-utilities':
                showModal('Комунальні платежі', `
                    <select class="modal-select" id="utilityType">
                        <option value="Електроенергія">Електроенергія</option>
                        <option value="Газ">Газ</option>
                        <option value="Вода">Вода</option>
                        <option value="Опалення">Опалення</option>
                    </select>
                    <input class="modal-input" id="utilitySum" placeholder="Сума" type="number" step="0.01">
                    <input class="modal-input" placeholder="Особовий рахунок">
                `, true, () => {
                    const sum = parseFloat(document.getElementById('utilitySum')?.value);
                    const type = document.getElementById('utilityType')?.value;
                    if (isNaN(sum) || sum <= 0) {
                        showInfoModal('Помилка', 'Введіть коректну суму');
                        return;
                    }
                    if (sum > cards[activeCardIndex].balance) {
                        showInfoModal('Помилка', 'Недостатньо коштів');
                        return;
                    }
                    addTransaction('expense', -sum, `Оплата ${type}`);
                    showInfoModal('Успіх', `Оплачено ${type} на суму ${sum.toFixed(2)} грн`);
                });
                break;
            case 'currency-exchange':
                showModal('Курс валют', `
                    <div style="text-align:center;">
                        <p>USD/UAH: 41.50</p>
                        <p>EUR/UAH: 45.20</p>
                        <p>PLN/UAH: 10.80</p>
                        <p>Оновлено: ${new Date().toLocaleString()}</p>
                    </div>
                `, false);
                break;
            case 'qr-payment':
                showModal('QR-платіж', '<p style="text-align:center;">Скануйте QR-код для оплати</p><div style="display:flex;justify-content:center;"><i class="fas fa-qrcode" style="font-size:150px;color:#8ac53e;"></i></div>', false);
                break;
            case 'change-pin':
                showModal('Зміна ПІН-коду', `
                    <input class="modal-input" type="password" placeholder="Поточний ПІН" maxlength="4">
                    <input class="modal-input" type="password" placeholder="Новий ПІН" maxlength="4">
                    <input class="modal-input" type="password" placeholder="Підтвердження" maxlength="4">
                `, true, () => showInfoModal('Успіх', 'ПІН-код успішно змінено'));
                break;
            case 'change-password':
                showModal('Зміна паролю', `
                    <input class="modal-input" type="password" placeholder="Поточний пароль">
                    <input class="modal-input" type="password" placeholder="Новий пароль">
                    <input class="modal-input" type="password" placeholder="Підтвердження">
                `, true, () => showInfoModal('Успіх', 'Пароль змінено'));
                break;
            case 'biometric':
                showInfoModal('Біометрія', 'Функція в розробці');
                break;
            case 'block-card':
                showModal('Блокування карти', '<p>Ви впевнені, що хочете заблокувати карту?</p><p class="text-danger" style="color:#ff7b72;">Після блокування відновлення може зайняти до 5 днів</p>', true, () => showInfoModal('Карта заблокована', 'Карту заблоковано. Для розблокування зверніться в підтримку'));
                break;
            case 'change-limit':
                showModal('Зміна лімітів', `
                    <p>Поточний денний ліміт: 50 000 ₴</p>
                    <input class="modal-input" id="newLimit" placeholder="Новий ліміт" type="number" value="50000">
                `, true, () => showInfoModal('Ліміт змінено', `Ліміт змінено на ${document.getElementById('newLimit')?.value} ₴`));
                break;
            case 'card-settings':
                showModal('Налаштування карти', `
                    <p>Безконтактна оплата: Увімкнено</p>
                    <p>Інтернет-платежі: Увімкнено</p>
                    <p>Зняття за кордоном: Увімкнено</p>
                `, false);
                break;
            case 'change-card-skin':
                const skinButtons = skins.map(s => `<button class="skin-option" data-skin="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('');
                showModal('Скін карти', `<div style="display:flex;flex-wrap:wrap;gap:8px;">${skinButtons}</div>`, false, null, false);
                document.querySelectorAll('.skin-option').forEach(b => {
                    b.addEventListener('click', () => {
                        skin = b.dataset.skin;
                        applySkin();
                        saveUISettings();
                        modal.classList.remove('show');
                    });
                });
                break;
            case 'change-language':
                showModal('Мова інтерфейсу', `
                    <div style="display:flex;flex-wrap:wrap;gap:8px;">
                        <button class="lang-option" data-lang="uk">Українська</button>
                        <button class="lang-option" data-lang="en">English</button>
                        <button class="lang-option" data-lang="pl">Polski</button>
                    </div>
                `, false, null, false);
                document.querySelectorAll('.lang-option').forEach(b => {
                    b.addEventListener('click', () => {
                        language = b.dataset.lang;
                        applyLanguage();
                        saveUISettings();
                        modal.classList.remove('show');
                    });
                });
                break;
            case 'toggle-balance':
                document.getElementById('toggleBalanceEye').click();
                break;
            case 'profile-settings':
                showModal('Особисті дані', `
                    <p><strong>Ім'я:</strong> ${currentUser?.name}</p>
                    <p><strong>Email:</strong> ${currentUser?.email}</p>
                    <p><strong>Телефон:</strong> ${currentUser?.phone || 'Не вказано'}</p>
                    <button class="modal-btn-primary" style="margin-top:15px;" id="editProfileBtn">Редагувати</button>
                `, false);
                break;
            case 'security':
                showModal('Безпека', `
                    <p>✅ Двофакторна аутентифікація: Вимкнено</p>
                    <p>✅ Останній вхід: ${new Date().toLocaleString()}</p>
                    <p>✅ Активні сесії: 1</p>
                `, false);
                break;
            case 'limits':
                showModal('Ліміти', `
                    <p>Денний ліміт: 50 000 ₴</p>
                    <p>Місячний ліміт: 500 000 ₴</p>
                    <p>Ліміт на зняття: 20 000 ₴/день</p>
                `, false);
                break;
            case 'about':
                showModal('Про додаток', `
                    <p>Monobank v2.0.0</p>
                    <p>Сучасний банківський застосунок з усіма необхідними функціями</p>
                    <p>© 2025 Monobank. Всі права захищено.</p>
                `, false);
                break;
            case 'support':
                showModal('Підтримка', `
                    <p>📞 Гаряча лінія: 0 800 123 456</p>
                    <p>📧 Email: support@monobank.ua</p>
                    <p>💬 Чат-підтримка: 24/7</p>
                `, false);
                break;
            case 'pay-creator':
                showModal('Оплата навчання Creator', `
                    <p>Курс "JavaScript Комплексний"</p>
                    <p>Вартість: 12 500 ₴</p>
                `, true, () => {
                    if (12500 > cards[activeCardIndex].balance) {
                        showInfoModal('Помилка', 'Недостатньо коштів');
                        return;
                    }
                    addTransaction('expense', -12500, 'Оплата навчання Creator');
                    showInfoModal('Успіх', 'Оплата пройшла успішно! Доступ до курсу відкрито.');
                });
                break;
            case 'cash-collection':
                showModal('Режим інкасації', '<p>Для бізнесу: Замовлення інкасації</p><input class="modal-input" placeholder="Сума для інкасації"><input class="modal-input" placeholder="Адреса">', true, () => showInfoModal('Інкасація', 'Заявку прийнято, очікуйте інкасатора'));
                break;
            case 'internet-pay':
                showModal('Оплата інтернету', `
                    <select class="modal-select"><option>Київстар</option><option>Vodafone</option><option>Укртелеком</option></select>
                    <input class="modal-input" placeholder="Особовий рахунок">
                    <input class="modal-input" id="internetSum" placeholder="Сума" type="number">
                `, true, () => {
                    const sum = parseFloat(document.getElementById('internetSum')?.value);
                    if (sum > 0 && sum <= cards[activeCardIndex].balance) {
                        addTransaction('expense', -sum, 'Оплата інтернету');
                        showInfoModal('Успіх', 'Інтернет оплачено');
                    } else showInfoModal('Помилка', 'Недостатньо коштів або некоректна сума');
                });
                break;
            case 'tax-pay':
                showModal('Сплата податків', '<input class="modal-input" placeholder="ІПН"><input class="modal-input" placeholder="Сума" type="number">', true, () => showInfoModal('Податки', 'Податки сплачено'));
                break;
            case 'donation':
                showModal('Благодійність', `
                    <select class="modal-select">
                        <option>Повернись живим</option>
                        <option>Фонд Сергія Притули</option>
                        <option>Армія SOS</option>
                    </select>
                    <input class="modal-input" placeholder="Сума" type="number">
                `, true, () => showInfoModal('Дякуємо!', 'Ваш внесок важливий для перемоги'));
                break;
            case 'exchange-rates':
                showModal('Курси валют', `
                    <div style="text-align:center;">
                        <p>🇺🇸 USD: 41.50 / 42.10</p>
                        <p>🇪🇺 EUR: 45.20 / 46.00</p>
                        <p>🇵🇱 PLN: 10.80 / 11.20</p>
                        <p>🇬🇧 GBP: 52.50 / 53.30</p>
                    </div>
                `, false);
                break;
            default:
                showModal('Інформація', `<p>Дія "${action}" в демо-режимі</p>`);
        }
    });

    // Закриття модалки
    modalClose.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    
    // Таби авторизації
    loginTab.addEventListener('click', () => showAuthTab('login'));
    registerTab.addEventListener('click', () => showAuthTab('register'));
    switchToRegister.addEventListener('click', () => showAuthTab('register'));
    switchToLogin.addEventListener('click', () => showAuthTab('login'));
    document.getElementById('addCardBtn')?.addEventListener('click', () => {
        document.querySelector('[data-action="add-card"]')?.click();
    });
    document.getElementById('userProfile')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('profileDropdown');
        dropdown.classList.toggle('active');
    });
    document.getElementById('filterHistory')?.addEventListener('click', () => {
        showModal('Фільтр по даті', `
            <input type="date" class="modal-input" id="dateFrom">
            <input type="date" class="modal-input" id="dateTo">
        `, true, () => {
            showInfoModal('Фільтр', 'Застосовано фільтр за датою');
        });
    });
    document.getElementById('searchIcon')?.addEventListener('click', () => {
        showModal('Пошук', '<input class="modal-input" placeholder="Пошук за назвою або сумою">', true, () => {
            showInfoModal('Пошук', 'Результати пошуку (демо)');
        });
    });
    document.getElementById('notificationIcon')?.addEventListener('click', () => {
        showModal('Сповіщення', `
            <div style="max-height:300px;overflow-y:auto;">
                <p>🔔 Нова операція на картці</p>
                <p>💳 Зміна курсу валют</p>
                <p>💰 Надходження зарплати</p>
            </div>
        `, false);
    });

    // Обробка кредитів
    document.querySelectorAll('.loan-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal('Сплата кредиту', '<input class="modal-input" placeholder="Сума платежу" type="number">', true, () => {
                showInfoModal('Кредит', 'Платіж прийнято до списання');
            });
        });
    });

    // ========== ІНІЦІАЛІЗАЦІЯ ==========
    loadUISettings();
    
    if (loadSession()) {
        cards = currentUser.cards;
        if (activeCardIndex >= cards.length) activeCardIndex = 0;
        if (profileNameSpan) profileNameSpan.innerText = currentUser.name;
        if (profileEmailSpan) profileEmailSpan.innerText = currentUser.email;
        updateCardUI();
        authScreen.classList.remove('active');
        appMain.classList.add('active');
        showPage('home');
        applySkin();
    } else {
        authScreen.classList.add('active');
        appMain.classList.remove('active');
        showAuthTab('login');
    }
});