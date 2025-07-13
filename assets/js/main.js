document.addEventListener('DOMContentLoaded', () => {
  // Конфигурация Supabase
 const SUPABASE_URL = 'https://djiliffgqzzfvdoeckud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaWxpZmZncXp6ZnZkb2Vja3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODk3NDMsImV4cCI6MjA2NzU2NTc0M30.GXDKlvvNdLpn_ecqqRBt3_1MgxQp3TNRRCkpGGvfmj0';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


  // Константы и переменные
  let currentUser = null;
  
  // ===================== МУЛЬТИЯЗЫЧНОСТЬ =====================
  let currentLang = localStorage.getItem('chem_lang') || 'ru';
  let translations = {};

  // Загрузка переводов
  async function loadTranslations() {
    try {
      const response = await fetch(`/locales/${currentLang}.json`);
      translations = await response.json();
      applyTranslations();
    } catch (err) {
      console.error('Ошибка загрузки переводов:', err);
    }
  }

  // Применение переводов
  function applyTranslations() {
    // Статические элементы
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key]) {
        el.textContent = translations[key];
      }
    });
    
    // Динамические плейсхолдеры
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[key]) {
        el.placeholder = translations[key];
      }
    });
  }

  // Инициализация переключателя языков
  function initLanguageSwitcher() {
    const langContainer = document.createElement('div');
    langContainer.className = 'lang-switcher';
    langContainer.innerHTML = `
      <button data-lang="ru" class="${currentLang === 'ru' ? 'active' : ''}">Рус</button>
      <button data-lang="kk" class="${currentLang === 'kk' ? 'active' : ''}">Қаз</button>
    `;
    
    document.querySelector('.hero').prepend(langContainer);
    
    langContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async () => {
        currentLang = btn.dataset.lang;
        localStorage.setItem('chem_lang', currentLang);
        
        // Обновление активной кнопки
        document.querySelectorAll('.lang-switcher button').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        
        // Перезагрузка переводов
        await loadTranslations();
        
        // Обновление UI
        updateAuthUITexts();
        
        // Закрытие всех модальных окон
        resetUI();
      });
    });
    
    // Установите русский как активный по умолчанию
    document.querySelector('.lang-switcher button[data-lang="ru"]').classList.add('active');
  }

  // Сброс UI при смене языка
  function resetUI() {
    // Закрываем модальные окна
    modalOverlay.hidden = true;

    // Удаляем страницу товара, если есть
    const productPage = document.getElementById('product-page');
    if (productPage) {
      productPage.remove();
      document.querySelector('.hero').style.display = '';
      document.querySelector('.categories').style.display = '';
      document.querySelector('.footer').style.display = '';
    }

    // Удаляем мини-плитки
    const miniOverlay = document.querySelector('.mini-overlay');
    if (miniOverlay) {
      miniOverlay.remove();
      document.body.classList.remove('no-scroll');
    }
  }

  // Элементы интерфейса
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn = document.getElementById('login-btn');
  const cabinetBtn = document.getElementById('cabinet-btn');
  const heroActs = document.querySelector('.hero__actions');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  const searchInput = document.querySelector('.hero__search input');
  
  // ===================== АВТОРИЗАЦИЯ =====================
  // Проверка авторизации
  const checkAuth = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (err) {
      console.error('Auth check failed:', err);
      return null;
    }
  };
  
  // Обновление UI в зависимости от авторизации
  const updateAuthState = async () => {
    currentUser = await checkAuth();
    updateAuthUITexts();
  };

  // Обновление текстов UI авторизации
  const updateAuthUITexts = () => {
    if (currentUser) {
      signupBtn.style.display = 'none';
      loginBtn.style.display = 'none';
      cabinetBtn.style.display = '';
      cabinetBtn.textContent = translations.cabinet_button || 'Кабинет';
    } else {
      signupBtn.style.display = '';
      loginBtn.style.display = '';
      cabinetBtn.style.display = 'none';
    }
    
    // Обновляем тексты кнопок
    if (translations.signup_button) {
      signupBtn.textContent = translations.signup_button;
    }
    if (document.getElementById('catalog-btn') && translations.catalog_button) {
      document.getElementById('catalog-btn').textContent = translations.catalog_button;
    }
  };
  
  // Показать форму авторизации
  const showLoginForm = () => {
    modalContent.innerHTML = `
      <div class="auth-form">
        <h2 style="margin-top:0;text-align:center" data-i18n="login_title"></h2>
        <input type="email" id="login-email" data-i18n-placeholder="email_placeholder" required>
        <input type="password" id="login-password" data-i18n-placeholder="password_placeholder" required>
        <button type="button" class="btn btn-primary" id="login-submit" style="width:100%;margin-top:16px" data-i18n="login_title"></button>
        <div class="auth-divider">${currentLang === 'ru' ? 'или' : 'немесе'}</div>
        <button type="button" class="btn btn-google" style="width:100%">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="18" style="vertical-align:middle">
          <span data-i18n="login_google"></span>
        </button>
      </div>
    `;
    
    modalOverlay.hidden = false;
    applyTranslations();
    
    // Обработчик входа
    document.getElementById('login-submit').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          throw new Error(error.message || (currentLang === 'ru' ? 'Ошибка входа' : 'Кіру қатесі'));
        }
        
        currentUser = data.user;
        modalOverlay.hidden = true;
        updateAuthState();
      } catch (err) {
        alert(err.message);
      }
    });
  };
  
  // Показать форму регистрации
  const showSignupForm = () => {
    modalContent.innerHTML = `
      <div class="auth-form">
        <h2 style="margin-top:0;text-align:center" data-i18n="register_title"></h2>
        <input type="email" id="signup-email" data-i18n-placeholder="email_placeholder" required>
        
        <div id="password-section" style="display:none">
          <input type="password" id="signup-password" data-i18n-placeholder="password_placeholder" required>
          <input type="password" id="signup-password2" data-i18n-placeholder="repeat_password" required style="margin-top:8px">
          
          <div style="margin: 12px 0">
            <label>
              <input type="checkbox" id="seller-role">
              <span data-i18n="become_seller"></span>
            </label>
          </div>
          
          <div id="seller-fields" style="display:none; margin-top:8px">
            <input type="text" id="company-name" data-i18n-placeholder="company_name">
            <input type="text" id="company-address" data-i18n-placeholder="company_address" style="margin-top:8px">
          </div>
          
          <button type="button" class="btn btn-primary" id="signup-submit" style="width:100%;margin-top:16px" data-i18n="register_submit"></button>
        </div>
        
        <button type="button" class="btn btn-google" id="google-signup" style="width:100%;margin-bottom:12px">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="18" style="vertical-align:middle">
          <span data-i18n="login_google"></span>
        </button>
        
        <button type="button" class="btn btn-secondary" id="create-password-btn" style="width:100%" data-i18n="create_password"></button>
      </div>
    `;
    
    modalOverlay.hidden = false;
    applyTranslations();
    
    // Кнопка "Создать пароль"
    document.getElementById('create-password-btn').addEventListener('click', () => {
      document.getElementById('password-section').style.display = 'block';
      document.getElementById('create-password-btn').style.display = 'none';
      document.getElementById('google-signup').style.display = 'none';
    });
    
    // Переключатель "Стать продавцом"
    document.getElementById('seller-role').addEventListener('change', function() {
      document.getElementById('seller-fields').style.display = this.checked ? 'block' : 'none';
    });
    
    // Кнопка регистрации
    document.getElementById('signup-submit').addEventListener('click', async () => {
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const password2 = document.getElementById('signup-password2').value;
      const isSeller = document.getElementById('seller-role').checked;
      const companyName = isSeller ? document.getElementById('company-name').value : '';
      const companyAddress = isSeller ? document.getElementById('company-address').value : '';
      
      if (password !== password2) {
        alert(currentLang === 'ru' ? 'Пароли не совпадают' : 'Құпия сөздер сәйкес келмейді');
        return;
      }
      
      if (isSeller && (!companyName || !companyAddress)) {
        alert(currentLang === 'ru' ? 'Заполните данные компании' : 'Компания деректерін толтырыңыз');
        return;
      }
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: isSeller ? 'seller' : 'user',
              company: isSeller ? companyName : null,
              address: isSeller ? companyAddress : null
            }
          }
        });
        
        if (error) {
          throw new Error(error.message || (currentLang === 'ru' ? 'Ошибка регистрации' : 'Тіркеу қатесі'));
        }
        
        if (data.user) {
          currentUser = data.user;
          alert(currentLang === 'ru' 
            ? 'Регистрация успешна! Проверьте почту для подтверждения.' 
            : 'Тіркелу сәтті аяқталды! Растау үшін электрондық поштаңызды тексеріңіз.');
          modalOverlay.hidden = true;
          updateAuthState();
        }
      } catch (err) {
        alert(err.message);
      }
    });
  };
  
  // ===================== ЛИЧНЫЙ КАБИНЕТ =====================
  const showCabinet = () => {
    if (!currentUser) return;
    
    // Извлекаем метаданные пользователя
    const metadata = currentUser.user_metadata || {};
    const role = metadata.role || 'user';
    const company = metadata.company || '';
    const address = metadata.address || '';
    
    // Кабинет продавца
    if (role === 'seller') {
      modalContent.innerHTML = `
        <div class="cabinet-container">
          <h2 style="margin-top:0;text-align:center" data-i18n="cabinet_button"></h2>
          
          <div class="user-info">
            <div class="user-avatar">
              <img src="https://ui-avatars.com/api/?name=${company || currentUser.email}&background=18d3b3&color=fff" alt="Аватар">
            </div>
            <div class="user-details">
              <h3>${company || currentUser.email}</h3>
              <p>${currentUser.email}</p>
              <p>${currentLang === 'ru' ? 'Роль' : 'Рөл'}: ${currentLang === 'ru' ? 'Продавец' : 'Сатушы'}</p>
              ${address ? `<p>${address}</p>` : ''}
            </div>
          </div>
          
          <div class="cabinet-tabs">
            <button class="tab-btn active" data-tab="products" data-i18n="add_product"></button>
            <button class="tab-btn" data-tab="orders" data-i18n="my_orders"></button>
            <button class="tab-btn" data-tab="settings" data-i18n="settings"></button>
          </div>
          
          <div class="tab-content active" id="products-tab">
            <button class="btn btn-primary" id="add-product">+ <span data-i18n="add_product"></span></button>
            <div class="product-list" style="margin-top:20px">
              <p>${currentLang === 'ru' ? 'Здесь будут ваши товары' : 'Сіздің өнімдеріңіз осында болады'}</p>
            </div>
          </div>
          
          <div class="tab-content" id="settings-tab" style="display:none">
            <h3 data-i18n="settings"></h3>
            <div class="form-group">
              <label>${currentLang === 'ru' ? 'Название компании' : 'Компания атауы'}</label>
              <input type="text" id="company-name-input" value="${company}">
            </div>
            <div class="form-group">
              <label>${currentLang === 'ru' ? 'Адрес' : 'Мекенжай'}</label>
              <input type="text" id="company-address-input" value="${address}">
            </div>
            <button class="btn btn-primary" id="save-settings" data-i18n="save"></button>
          </div>
          
          <button class="btn btn-primary" id="logout-btn" style="margin-top:20px" data-i18n="logout"></button>
        </div>
      `;
    } 
    // Кабинет покупателя
    else {
      modalContent.innerHTML = `
        <div class="cabinet-container">
          <h2 style="margin-top:0;text-align:center" data-i18n="cabinet_button"></h2>
          
          <div class="user-info">
            <div class="user-avatar">
              <img src="https://ui-avatars.com/api/?name=${currentUser.email}&background=18d3b3&color=fff" alt="Аватар">
            </div>
            <div class="user-details">
              <h3>${currentUser.email.split('@')[0]}</h3>
              <p>${currentUser.email}</p>
              <p>${currentLang === 'ru' ? 'Роль' : 'Рөл'}: ${currentLang === 'ru' ? 'Покупатель' : 'Сатып алушы'}</p>
            </div>
          </div>
          
          <div class="cabinet-actions">
            <button class="btn btn-secondary" data-i18n="my_orders"></button>
            <button class="btn btn-secondary" data-i18n="favorites"></button>
            <button class="btn btn-secondary" data-i18n="settings"></button>
            <button class="btn btn-primary" id="logout-btn" style="margin-top:20px" data-i18n="logout"></button>
          </div>
        </div>
      `;
    }
    
    modalOverlay.hidden = false;
    applyTranslations();
    
    // Переключение вкладок (для продавца)
    if (role === 'seller') {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
          
          btn.classList.add('active');
          document.getElementById(`${btn.dataset.tab}-tab`).style.display = 'block';
        });
      });
      
      // Кнопка добавления товара
      document.getElementById('add-product')?.addEventListener('click', showProductForm);
      
      // Сохранение настроек
      document.getElementById('save-settings')?.addEventListener('click', async () => {
        const companyName = document.getElementById('company-name-input').value;
        const companyAddress = document.getElementById('company-address-input').value;
        
        try {
          const { error } = await supabase.auth.updateUser({
            data: {
              company: companyName,
              address: companyAddress
            }
          });
          
          if (error) throw error;
          
          // Обновляем локальные данные
          currentUser.user_metadata = {
            ...currentUser.user_metadata,
            company: companyName,
            address: companyAddress
          };
          
          alert(currentLang === 'ru' 
            ? 'Настройки сохранены!' 
            : 'Баптаулар сақталды!');
        } catch (err) {
          alert(currentLang === 'ru' 
            ? 'Ошибка сохранения: ' + err.message 
            : 'Сақтау қатесі: ' + err.message);
        }
      });
    }
    
    // Выход из системы
    document.getElementById('logout-btn').addEventListener('click', async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        modalOverlay.hidden = true;
        updateAuthState();
      } catch (err) {
        console.error('Logout error:', err);
        alert(currentLang === 'ru' 
          ? 'Ошибка выхода: ' + err.message 
          : 'Шығу қатесі: ' + err.message);
      }
    });
  };
  
  // Форма добавления/редактирования товара
  const showProductForm = (product = null) => {
    modalContent.innerHTML = `
      <div class="product-form">
        <h2>${product ? translations.edit_product : translations.add_product}</h2>
        
        <div class="form-group">
          <label data-i18n="product_name"></label>
          <input type="text" id="product-name" value="${product?.name || ''}" required>
        </div>
        
        <div class="form-group">
          <label data-i18n="cas_number"></label>
          <input type="text" id="cas-number" value="${product?.cas || ''}">
        </div>
        
        <div class="form-group">
          <label data-i18n="category"></label>
          <select id="product-category">
            <option value="lab" ${product?.category === 'lab' ? 'selected' : ''}>${translations.lab_chem}</option>
            <option value="industrial" ${product?.category === 'industrial' ? 'selected' : ''}>${translations.industrial_chem}</option>
            <option value="construction" ${product?.category === 'construction' ? 'selected' : ''}>${translations.construction_chem}</option>
            <option value="household" ${product?.category === 'household' ? 'selected' : ''}>${translations.household_chem}</option>
            <option value="controlled" ${product?.category === 'controlled' ? 'selected' : ''}>${translations.controlled}</option>
          </select>
        </div>
        
        <div class="form-group">
          <label data-i18n="description"></label>
          <textarea id="product-desc">${product?.description || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label data-i18n="price"></label>
          <input type="number" id="product-price" value="${product?.price || ''}" required>
        </div>
        
        <div class="form-group">
          <label data-i18n="availability"></label>
          <select id="product-availability">
            <option value="in-stock" ${product?.availability === 'in-stock' ? 'selected' : ''}>${translations.in_stock}</option>
            <option value="out-of-stock" ${product?.availability === 'out-of-stock' ? 'selected' : ''}>${translations.out_of_stock}</option>
            <option value="on-order" ${product?.availability === 'on-order' ? 'selected' : ''}>${translations.on_order}</option>
          </select>
        </div>
        
        <div class="form-group">
          <label data-i18n="upload_images"></label>
          <input type="file" accept="image/*" multiple>
        </div>
        
        <button type="button" class="btn btn-primary" id="save-product">
          ${product ? translations.update : translations.save}
        </button>
      </div>
    `;
    
    applyTranslations();
    
    // Обработчик сохранения товара
    document.getElementById('save-product').addEventListener('click', () => {
      const productData = {
        name: document.getElementById('product-name').value,
        cas: document.getElementById('cas-number').value,
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-desc').value,
        price: document.getElementById('product-price').value,
        availability: document.getElementById('product-availability').value
      };
      
      // В реальном приложении здесь будет вызов API
      alert(currentLang === 'ru' 
        ? `Товар "${productData.name}" сохранен!` 
        : `"${productData.name}" өнімі сақталды!`);
      
      modalOverlay.hidden = true;
    });
  };
  
  // ===================== ТОВАРЫ И КАТАЛОГ =====================
  // Заглушка данных о товарах
  const mockProducts = {
    lab: [
      { 
        id: 1, 
        name: { ru: "Соляная кислота", kk: "Тұз қышқылы" }, 
        cas: "7647-01-0", 
        price: 1500, 
        availability: "in-stock",
        description: {
          ru: "Сильная неорганическая кислота, широко применяемая в промышленности",
          kk: "Өнеркәсіпте кеңінен қолданылатын күшті бейорганикалық қышқыл"
        }
      },
      // ... другие товары
    ],
    // ... другие категории
  };

  // Заглушка данных о продавцах
  const mockSellers = [
    { id: 1, name: { ru: "ХимПром Казахстан", kk: "ХимПром Қазақстан" }, address: "Алматы, ул. Толе би, 123", rating: 4.8 },
    // ... другие продавцы
  ];

  // Показать страницу товара
  const showProductPage = (product) => {
    // Скрываем основной контент
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.categories').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
    
    // Локализованные данные
    const productName = product.name[currentLang] || product.name.ru;
    const productDescription = product.description?.[currentLang] || product.description?.ru || '';
    
    // Создаем контейнер для страницы товара
    const productPage = document.createElement('div');
    productPage.id = 'product-page';
    productPage.innerHTML = `
      <div class="product-header">
        <button class="back-btn">← ${translations.back}</button>
        <h2 class="product-name">${productName}</h2>
      </div>
      
      <div class="product-gallery">
        <div class="product-image" style="background:url('https://via.placeholder.com/600x400?text=Product+Image') center/cover"></div>
      </div>
      
      <div class="product-info">
        <div class="product-meta">
          ${product.cas ? `<p><strong>CAS:</strong> ${product.cas}</p>` : ''}
          <p class="price-tag">${product.price} ₸</p>
          <p><strong>${translations.availability_label}</strong> 
            <span class="availability ${product.availability}">
              ${translations[product.availability]}
            </span>
          </p>
        </div>
        
        <div class="product-description">
          <h3>${currentLang === 'ru' ? 'Описание' : 'Сипаттама'}</h3>
          <p>${productDescription}</p>
        </div>
        
        <div class="sellers-list">
          <h3>${translations.sellers}</h3>
          ${mockSellers.map(seller => {
            const sellerName = seller.name[currentLang] || seller.name.ru;
            return `
            <div class="seller-card">
              <div class="seller-info">
                <h4>${sellerName}</h4>
                <p>${seller.address}</p>
                <p>${translations.rating}: ${seller.rating} ★</p>
              </div>
              <div class="seller-actions">
                <button class="btn btn-primary" data-i18n="buy"></button>
                <button class="btn btn-secondary" data-i18n="contacts"></button>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(productPage);
    applyTranslations();
    
    // Кнопка "Назад"
    productPage.querySelector('.back-btn').addEventListener('click', () => {
      productPage.remove();
      document.querySelector('.hero').style.display = '';
      document.querySelector('.categories').style.display = '';
      document.querySelector('.footer').style.display = '';
    });
  };

  // ===================== ОБРАБОТЧИКИ СОБЫТИЙ =====================
  // Кнопки авторизации
  signupBtn.addEventListener('click', showSignupForm);
  loginBtn.addEventListener('click', showLoginForm);
  cabinetBtn.addEventListener('click', showCabinet);
  
  // Закрытие модалки
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay || e.target.classList.contains('modal-close')) {
      modalOverlay.hidden = true;
    }
  });
  
  // ===================== ФУНКЦИОНАЛ ПЛИТОК =====================
  /* ========= плавный скролл ========= */
  document.getElementById('catalog-btn')?.addEventListener(
    'click', () => document.querySelector('#catalog')
      .scrollIntoView({ behavior: 'smooth' })
  );

  /* ========= hero parallax ========= */
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', e => {
    const { left, top, width, height } = hero.getBoundingClientRect();
    const x = ((e.clientX - left) / width  - 0.5) * 20;
    const y = ((e.clientY - top ) / height - 0.5) * 20;
    hero.style.backgroundPosition = `${50 - x}% ${50 - y}%`;
  });
  hero.addEventListener('mouseleave', () => hero.style.backgroundPosition = '50% 50%');

  /* ========= scroll-reveal категорий ========= */
  const io = new IntersectionObserver(
    entries => entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        io.unobserve(en.target);
      }
    }),
    { threshold: .35 }
  );
  document.querySelectorAll('.category').forEach(el => io.observe(el));

  /* ========= Открытие мини-плиток ========= */
  document.querySelectorAll('.category').forEach(card => {
    const categoryId = card.getAttribute('href').replace('#', '');
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openMini(card, categoryId);
    });
  });

  async function openMini(card, categoryId) {
    const { left, top, width, height } = card.getBoundingClientRect();
    const ox = left + width / 2, oy = top + height / 2;

    const ov = document.createElement('div'); 
    ov.className = 'mini-overlay';
    const closeBtn = Object.assign(document.createElement('button'), {
      className: 'mini-close', innerHTML: '&times;'
    });
    const grid = document.createElement('div'); 
    grid.className = 'mini-grid';
    ov.append(closeBtn, grid); 
    document.body.append(ov);
    document.body.classList.add('no-scroll');

    // Заголовок категории
    const title = document.createElement('h2');
    title.textContent = card.querySelector('.category__title').textContent;
    title.style.textAlign = 'center';
    title.style.width = '100%';
    title.style.margin = '0 0 20px';
    title.style.color = '#fff';
    grid.parentNode.insertBefore(title, grid);

    // Получаем товары для категории (в реальном приложении - запрос к API)
    const products = mockProducts[categoryId] || [];
    
    products.forEach((product, i) => {
      const productName = product.name[currentLang] || product.name.ru;
      
      const t = document.createElement('div'); 
      t.className = 'mini-tile'; 
      grid.append(t);
      
      t.innerHTML = `
        <div class="mini-content">
          <div class="product-image" style="background:url('https://via.placeholder.com/250x150?text=${productName}') center/cover; height:100px"></div>
          <h4>${productName}</h4>
          <p class="price-tag">${product.price} ₸</p>
          <p class="availability ${product.availability}">${translations[product.availability]}</p>
        </div>
      `;
      
      // Клик по плитке открывает страницу товара
      t.addEventListener('click', () => {
        ov.remove();
        document.body.classList.remove('no-scroll');
        showProductPage(product);
      });

      // Анимация появления
      const fin = t.getBoundingClientRect();
      t.style.setProperty('--dx', `${ox - (fin.left + fin.width / 2)}px`);
      t.style.setProperty('--dy', `${oy - (fin.top  + fin.height / 2)}px`);
    });

    // Если нет товаров
    if (products.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = translations.no_products || 'Нет товаров в этой категории';
      emptyMsg.style.color = '#fff';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.width = '100%';
      grid.appendChild(emptyMsg);
    }

    // Анимируем появление
    requestAnimationFrame(() => grid.querySelectorAll('.mini-tile')?.forEach(t => { 
      t.style.opacity = '1'; 
      t.style.transform = 'translate(0,0) scale(1)'; 
    }));

    const close = () => { 
      ov.remove(); 
      document.body.classList.remove('no-scroll'); 
    };
    closeBtn.onclick = close;
    ov.addEventListener('click', e => { 
      if (e.target === ov) close(); 
    });
    document.addEventListener('keydown', e => { 
      if (e.key === 'Escape') close(); 
    }, { once: true });
  }

  // ===================== ИНИЦИАЛИЗАЦИЯ =====================
  // Загрузка переводов и инициализация переключателя
  loadTranslations().then(() => {
    // Инициализация переключателя языков
    initLanguageSwitcher();
    
    // Обновление состояния авторизации
    updateAuthState();
  });
});