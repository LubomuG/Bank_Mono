        document.addEventListener('DOMContentLoaded', () => {
            // ========== ГЛОБАЛЬНІ ДАНІ ==========
            let currentUser = null;
            let cards = [];
            let activeCardIndex = 0;
            let isBalanceHidden = false;
            let skin = 'green';
            let language = 'uk';

            const skins = ['green', 'blue', 'red', 'purple', 'gold', 'silver', 'cyan', 'cosmic'];

            const translations = {
                uk: { appName: 'monobank', totalBalance: 'Загальний баланс', quickActions: 'Швидкі дії', withdraw: 'Зняти готівку', topupCard: 'Поповнити карту', transfer: 'Переказати кошти', topupPhone: 'Поповнити телефон', payUtilit: 'Оплатити комуналку', viewBalance: 'Подивитись баланс', history: 'Історія', changeLimit: 'Змінити ліміт', printBalance: 'Роздрукувати баланс', payCreator: 'Оплата Creator', cashCollection: 'Режим інкасації', services: 'Послуги', settings: 'Налаштування', changePin: 'Змінити ПІН', blockCard: 'Заблокувати карту', changeSkin: 'Змінити скін', changeLang: 'Змінити мову', toggleBalance: 'Показати/ховати баланс', addCard: 'Додати картку', logout: 'Вийти', home: 'Головна', historyTab: 'Історія', servicesTab: 'Послуги', settingsTab: 'Налаштування', historyTitle: 'Історія' },
                en: { appName: 'monobank', totalBalance: 'Total balance', quickActions: 'Quick actions', withdraw: 'Withdraw cash', topupCard: 'Top up card', transfer: 'Transfer', topupPhone: 'Top up phone', payUtilit: 'Pay utilities', viewBalance: 'View balance', history: 'History', changeLimit: 'Change limit', printBalance: 'Print balance', payCreator: 'Pay Creator', cashCollection: 'Collection mode', services: 'Services', settings: 'Settings', changePin: 'Change PIN', blockCard: 'Block card', changeSkin: 'Change skin', changeLang: 'Change language', toggleBalance: 'Show/hide balance', addCard: 'Add card', logout: 'Logout', home: 'Home', historyTab: 'History', servicesTab: 'Services', settingsTab: 'Settings', historyTitle: 'History' },
                pl: { appName: 'monobank', totalBalance: 'Saldo ogólne', quickActions: 'Szybkie akcje', withdraw: 'Wypłać gotówkę', topupCard: 'Doładuj kartę', transfer: 'Przelew', topupPhone: 'Doładuj telefon', payUtilit: 'Płać rachunki', viewBalance: 'Sprawdź saldo', history: 'Historia', changeLimit: 'Zmień limit', printBalance: 'Drukuj saldo', payCreator: 'Płać za naukę', cashCollection: 'Tryb inkasa', services: 'Usługi', settings: 'Ustawienia', changePin: 'Zmień PIN', blockCard: 'Zablokuj kartę', changeSkin: 'Zmień wygląd', changeLang: 'Zmień język', toggleBalance: 'Pokaż/ukryj saldo', addCard: 'Dodaj kartę', logout: 'Wyloguj', home: 'Główna', historyTab: 'Historia', servicesTab: 'Usługi', settingsTab: 'Ustawienia', historyTitle: 'Historia' }
            };

            // Елементи
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

            // ========== ДОПОМІЖНІ ФУНКЦІЇ ==========
            function showInfoModal(title, message) {
                modalTitle.innerText = title;
                modalBody.innerHTML = `<p style="color:white;">${message}</p>`;
                modalFooter.innerHTML = `<button class="modal-btn-primary" id="infoOkBtn">OK</button>`;
                modal.classList.add('show');
                document.getElementById('infoOkBtn').addEventListener('click', () => modal.classList.remove('show'), { once: true });
            }

            function showModal(title, body, showConfirm = true, confirmCallback = null) {
                modalTitle.innerText = title;
                modalBody.innerHTML = body;
                modalFooter.innerHTML = '';
                if (showConfirm) {
                    const confirmBtn = document.createElement('button');
                    confirmBtn.innerText = language === 'uk' ? 'Підтвердити' : (language === 'en' ? 'Confirm' : 'Potwierdź');
                    confirmBtn.className = 'modal-btn-primary';
                    confirmBtn.addEventListener('click', () => {
                        if (confirmCallback) confirmCallback();
                        modal.classList.remove('show');
                    });
                    modalFooter.appendChild(confirmBtn);
                }
                const cancelBtn = document.createElement('button');
                cancelBtn.innerText = language === 'uk' ? 'Скасувати' : (language === 'en' ? 'Cancel' : 'Anuluj');
                cancelBtn.className = 'modal-btn-secondary';
                cancelBtn.addEventListener('click', () => modal.classList.remove('show'));
                modalFooter.appendChild(cancelBtn);
                modal.classList.add('show');
            }

            modalClose.addEventListener('click', () => modal.classList.remove('show'));
            window.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

            function formatBalance(amount) {
                return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ') + ' ₴';
            }

            // Оновлення UI картки та селектора
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
                if (document.getElementById('page-history').classList.contains('active')) {
                    renderHistory();
                }
            }

            // Додавання транзакції
            function addTransaction(type, amount, description) {
                const card = cards[activeCardIndex];
                if (!card.transactions) card.transactions = [];
                const date = new Date();
                const formattedDate = `${date.getDate()} ${date.toLocaleString('uk', { month: 'short' })} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;
                card.transactions.unshift({
                    icon: type === 'income' ? 'fa-briefcase' : 'fa-shopping-cart',
                    name: description,
                    date: formattedDate,
                    amount: amount,
                    type: amount > 0 ? 'positive' : 'negative'
                });
                card.balance += amount;
                updateCardUI();
                if (document.getElementById('page-history').classList.contains('active')) renderHistory();
            }

            function renderHistory() {
                const list = document.getElementById('historyList');
                const card = cards[activeCardIndex];
                const transactions = card.transactions || [];
                if (transactions.length === 0) {
                    list.innerHTML = '<p style="color:white; text-align:center;">Немає операцій</p>';
                    return;
                }
                let html = '<ul class="transactions-list">';
                transactions.forEach(t => {
                    html += `
                        <li class="transaction-item">
                            <i class="fas ${t.icon}"></i>
                            <div class="trans-desc">
                                <span class="trans-name">${t.name}</span>
                                <span class="trans-date">${t.date}</span>
                            </div>
                            <span class="trans-amount ${t.type}">${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)} ₴</span>
                        </li>
                    `;
                });
                html += '</ul>';
                list.innerHTML = html;
            }

            cardSelector.addEventListener('change', (e) => {
                activeCardIndex = parseInt(e.target.value);
                updateCardUI();
            });

            // ========== АВТОРИЗАЦІЯ ==========
            function showAuthTab(tab) {
                loginTab.classList.toggle('active', tab === 'login');
                registerTab.classList.toggle('active', tab === 'register');
                loginForm.classList.toggle('active', tab === 'login');
                registerForm.classList.toggle('active', tab === 'register');
            }
            loginTab.addEventListener('click', () => showAuthTab('login'));
            registerTab.addEventListener('click', () => showAuthTab('register'));
            switchToRegister.addEventListener('click', () => showAuthTab('register'));
            switchToLogin.addEventListener('click', () => showAuthTab('login'));

            // Реєстрація
            registerBtn.addEventListener('click', () => {
                const name = document.getElementById('reg-name').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const pass = document.getElementById('reg-password').value.trim();
                if (!name || !email || !pass) {
                    showInfoModal('Помилка', 'Заповніть всі поля');
                    return;
                }
                let users = JSON.parse(localStorage.getItem('monoUsers')) || [];
                if (users.find(u => u.email === email)) {
                    showInfoModal('Помилка', 'Користувач вже існує');
                    return;
                }
                const newCard = {
                    number: '5375 41•• •••• 1234',
                    holder: name.toUpperCase(),
                    expiry: '09/25',
                    balance: 15240.75,
                    transactions: [
                        { icon: 'fa-briefcase', name: 'Зарплата', date: '14 бер 18:02', amount: 22500, type: 'positive' },
                        { icon: 'fa-store', name: 'АТБ', date: '16 бер 12:45', amount: -328.5, type: 'negative' },
                        { icon: 'fa-wifi', name: 'Поповнення телефону', date: '15 бер 09:20', amount: -100, type: 'negative' }
                    ]
                };
                const newUser = { name, email, password: pass, cards: [newCard] };
                users.push(newUser);
                localStorage.setItem('monoUsers', JSON.stringify(users));
                showInfoModal('Успіх', 'Реєстрація успішна, увійдіть');
                showAuthTab('login');
            });

            // Вхід
            loginBtn.addEventListener('click', () => {
                const email = document.getElementById('login-email').value.trim();
                const pass = document.getElementById('login-password').value.trim();
                let users = JSON.parse(localStorage.getItem('monoUsers')) || [];
                if (email === '' || pass === '') {
                    showInfoModal('Помилка', 'Введіть email та пароль');
                    return;
                }
                if (email === 'demo@mail.com' && pass === '123456') {
                    currentUser = {
                        name: 'Іван Іваненко',
                        email: 'demo@mail.com',
                        cards: [{
                            number: '5375 41•• •••• 1234',
                            holder: 'ІВАН ІВАНЕНКО',
                            expiry: '09/25',
                            balance: 15240.75,
                            transactions: [
                                { icon: 'fa-briefcase', name: 'Зарплата', date: '14 бер 18:02', amount: 22500, type: 'positive' },
                                { icon: 'fa-store', name: 'АТБ', date: '16 бер 12:45', amount: -328.5, type: 'negative' },
                                { icon: 'fa-wifi', name: 'Поповнення телефону', date: '15 бер 09:20', amount: -100, type: 'negative' }
                            ]
                        }]
                    };
                } else {
                    const user = users.find(u => u.email === email && u.password === pass);
                    if (!user) {
                        showInfoModal('Помилка', 'Невірні дані');
                        return;
                    }
                    currentUser = user;
                }
                cards = currentUser.cards;
                activeCardIndex = 0;
                updateCardUI();
                authScreen.classList.remove('active');
                appMain.classList.add('active');
                showPage('home');
                applyLanguage();
                applySkin();
            });

            // Вихід
            document.getElementById('logoutBtn').addEventListener('click', () => {
                appMain.classList.remove('active');
                authScreen.classList.add('active');
                showAuthTab('login');
            });

            // Навігація
            const pages = { home: 'page-home', history: 'page-history', services: 'page-services', settings: 'page-settings' };
            function showPage(pageId) {
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(pages[pageId]).classList.add('active');
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.page === pageId);
                });
                if (pageId === 'history') renderHistory();
            }
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => showPage(item.dataset.page));
            });

            document.getElementById('toggleBalanceEye').addEventListener('click', () => {
                isBalanceHidden = !isBalanceHidden;
                document.getElementById('app-main').classList.toggle('balance-hidden', isBalanceHidden);
                document.getElementById('eyeIcon').className = isBalanceHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
            });

            function applySkin() {
                document.getElementById('app-main').classList.remove(...skins.map(s => `card-skin-${s}`));
                document.getElementById('app-main').classList.add(`card-skin-${skin}`);
            }

            function applyLanguage() {
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (translations[language] && translations[language][key]) {
                        el.innerText = translations[language][key];
                    }
                });
            }
            function changeLanguage(lang) {
                language = lang;
                applyLanguage();
            }

            // Обробка дій
            document.addEventListener('click', e => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                if (action === 'goto-history') { showPage('history'); return; }
                if (action === 'add-card') {
                    showModal('Додати картку', `
                        <p style="color:white;">Введіть дані нової картки</p>
                        <input class="modal-input" id="newCardNumber" placeholder="Номер картки" value="5355 1234 5678 9012">
                        <input class="modal-input" id="newCardHolder" placeholder="Власник" value="ПЕТРО ПЕТРЕНКО">
                        <input class="modal-input" id="newCardExpiry" placeholder="Термін" value="12/26">
                        <input class="modal-input" id="newCardBalance" type="number" placeholder="Баланс" value="5000.00">
                    `, true, () => {
                        const newCard = {
                            number: document.getElementById('newCardNumber').value,
                            holder: document.getElementById('newCardHolder').value.toUpperCase(),
                            expiry: document.getElementById('newCardExpiry').value,
                            balance: parseFloat(document.getElementById('newCardBalance').value) || 0,
                            transactions: []
                        };
                        cards.push(newCard);
                        activeCardIndex = cards.length - 1;
                        updateCardUI();
                        showInfoModal('Успіх', 'Картку додано!');
                    });
                    return;
                }
                switch (action) {
                    case 'view-balance':
                        showModal('Баланс', `<p style="font-size:28px; color:white;">${formatBalance(cards[activeCardIndex].balance)}</p>`);
                        break;
                    case 'print-balance':
                        showModal('Друк', `<p style="color:white;">Баланс надіслано на принтер</p><p style="color:white;">${formatBalance(cards[activeCardIndex].balance)}</p>`, true);
                        break;
                    case 'withdraw':
                        showModal('Зняття готівки', '<input class="modal-input" id="withdrawSum" placeholder="Сума" type="number" value="1000">', true, () => {
                            let s = parseFloat(document.getElementById('withdrawSum').value) || 0;
                            if (s > cards[activeCardIndex].balance) {
                                showInfoModal('Помилка', 'Недостатньо коштів');
                                return;
                            }
                            addTransaction('expense', -s, 'Зняття готівки');
                            showInfoModal('Успіх', `Знято ${s} грн`);
                        });
                        break;
                    case 'topup-card':
                        showModal('Поповнення карти', '<input class="modal-input" id="topupSum" placeholder="Сума" type="number" value="2000">', true, () => {
                            let s = parseFloat(document.getElementById('topupSum').value) || 0;
                            addTransaction('income', s, 'Поповнення карти');
                            showInfoModal('Успіх', `Карту поповнено на ${s} грн`);
                        });
                        break;
                    case 'transfer':
                        showModal('Переказ', '<input class="modal-input" placeholder="Отримувач"><input class="modal-input" id="transferSum" placeholder="Сума" type="number" value="500">', true, () => {
                            let s = parseFloat(document.getElementById('transferSum')?.value) || 0;
                            if (s > cards[activeCardIndex].balance) {
                                showInfoModal('Помилка', 'Недостатньо коштів');
                                return;
                            }
                            addTransaction('expense', -s, 'Переказ коштів');
                            showInfoModal('Успіх', 'Переказ виконано');
                        });
                        break;
                    case 'topup-phone':
                        showModal('Поповнення телефону', '<input class="modal-input" value="+380 67 123 45 67"><input class="modal-input" id="phoneSum" placeholder="Сума" type="number" value="100">', true, () => {
                            let s = parseFloat(document.getElementById('phoneSum')?.value) || 0;
                            if (s > cards[activeCardIndex].balance) {
                                showInfoModal('Помилка', 'Недостатньо коштів');
                                return;
                            }
                            addTransaction('expense', -s, 'Поповнення телефону');
                            showInfoModal('Успіх', 'Телефон поповнено');
                        });
                        break;
                    case 'pay-utilities':
                        showModal('Комуналка', '<select class="modal-input"><option>Київенерго</option><option>Газ</option></select><input class="modal-input" id="utilSum" value="1250.00" type="number">', true, () => {
                            let s = parseFloat(document.getElementById('utilSum')?.value) || 0;
                            if (s > cards[activeCardIndex].balance) {
                                showInfoModal('Помилка', 'Недостатньо коштів');
                                return;
                            }
                            addTransaction('expense', -s, 'Комунальні платежі');
                            showInfoModal('Успіх', 'Оплачено');
                        });
                        break;
                    case 'change-limit':
                        showModal('Ліміт', '<p style="color:white;">Поточний ліміт 50000</p><input class="modal-input" placeholder="Новий ліміт" value="75000">', true, () => showInfoModal('Успіх', 'Ліміт змінено (демо)'));
                        break;
                    case 'change-pin':
                        showModal('Зміна ПІН', '<input class="modal-input" type="password" placeholder="Новий ПІН" maxlength="4">', true, () => showInfoModal('Успіх', 'ПІН змінено'));
                        break;
                    case 'block-card':
                        showModal('Блокування', '<p style="color:white;">Ви впевнені?</p>', true, () => showInfoModal('Успіх', 'Карту заблоковано (демо)'));
                        break;
                    case 'change-card-skin':
                        let skinButtons = skins.map(s => `<button class="skin-option" data-skin="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('');
                        showModal('Скін карти', skinButtons, false);
                        document.querySelectorAll('.skin-option').forEach(b => {
                            b.addEventListener('click', () => { skin = b.dataset.skin; applySkin(); modal.classList.remove('show'); });
                        });
                        return;
                    case 'change-language':
                        showModal('Мова', `
                            <button class="lang-option" data-lang="uk">Українська</button>
                            <button class="lang-option" data-lang="en">English</button>
                            <button class="lang-option" data-lang="pl">Polski</button>
                        `, false);
                        document.querySelectorAll('.lang-option').forEach(b => {
                            b.addEventListener('click', () => { changeLanguage(b.dataset.lang); modal.classList.remove('show'); });
                        });
                        return;
                    case 'toggle-balance':
                        document.getElementById('toggleBalanceEye').click();
                        showModal('Баланс', isBalanceHidden ? 'Приховано' : 'Відображається', false);
                        break;
                    case 'cash-collection':
                        showModal('Режим інкасації', '<p style="color:white;">Активовано режим інкасації (демо)</p>', true, () => showInfoModal('Інкасація', 'Режим активовано'));
                        break;
                    case 'pay-creator':
                        showModal('Оплата Creator', '<p style="color:white;">Курс "JavaScript" — 12500 грн</p>', true, () => {
                            if (12500 > cards[activeCardIndex].balance) {
                                showInfoModal('Помилка', 'Недостатньо коштів');
                                return;
                            }
                            addTransaction('expense', -12500, 'Оплата навчання Creator');
                            showInfoModal('Оплата', 'Навчання оплачено');
                        });
                        break;
                    default: showModal('Дія', `<p style="color:white;">${action} (демо)</p>`);
                }
            });

            document.getElementById('filterHistory').addEventListener('click', () => showModal('Фільтр', '<p style="color:white;">Фільтр (демо)</p>', true));
            document.getElementById('addCardBtn').addEventListener('click', () => {
                document.querySelector('[data-action="add-card"]').click();
            });
            document.getElementById('userProfile').addEventListener('click', () => showModal('Профіль', `<p style="color:white;">${currentUser?.name || 'Користувач'}</p><p style="color:white;">${currentUser?.email}</p>`, false));

            // Ініціалізація
            applyLanguage();
            applySkin();
        });