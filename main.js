// main.js

const CAROUSEL_INTERVAL_MS = 5000; 
const TRANSITION_DURATION_MS = 500; 

document.addEventListener('DOMContentLoaded', () => {
    initThemeLogic();
    loadData();
    // Инициализация неоновых эффектов, только если это ПК и темная тема
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        initNeonEffects();
    }
});


// ====================================================================
// 1. ЛОГИКА ТЕМНОЙ ТЕМЫ
// ====================================================================

function initThemeLogic() {
    const themeToggle = document.getElementById('theme-toggle-input');
    const targetElement = document.body; 

    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const currentTheme = getPreferredTheme();
    targetElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark' && themeToggle) {
        themeToggle.checked = true;
    }

    if(themeToggle) {
        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            targetElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            // При смене темы, если мы на ПК, обновляем эффекты
            if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                 initNeonEffects(); 
            }
        });
    }
}


// ====================================================================
// 2. ОБЩАЯ ЗАГРУЗКА ДАННЫХ
// ====================================================================

async function loadData() {
    try {
        const response = await fetch('main.json'); 
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        const data = await response.json();
        
        const carouselElement = document.getElementById('teachers-carousel');
        if (data.teachers && data.teachers.length > 0 && carouselElement) {
            buildCarousel(data.teachers, carouselElement);
        }

        const newsContainer = document.getElementById('news-container');
        if (data.news && data.news.length > 0 && newsContainer) {
            buildNewsSection(data.news, newsContainer);
        }

    } catch (error) {
        console.error("Не удалось загрузить или обработать main.json. Проверьте файл и путь:", error);
        const carouselElement = document.getElementById('teachers-carousel');
        if (carouselElement) {
            carouselElement.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки данных преподавателей.</p>';
        }
        const newsContainer = document.getElementById('news-container');
        if (newsContainer) {
            newsContainer.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки данных новостей.</p>';
        }
    }
}

// ====================================================================
// 3. ЛОГИКА КАРОУСЕЛИ УЧИТЕЛЕЙ (Pixel-based + [A]+[A] duplication)
// ====================================================================

function buildCarousel(teachers, carouselElement) {
    const cardTemplate = (teacher) => `
        <div class="teacher-card">
            <a href="${teacher.link}" aria-label="Подробнее об учителе ${teacher.name}">
                <img src="${teacher.image}" alt="Фото ${teacher.name}">
            </a>
            <h3>${teacher.name}</h3>
            <p class="teacher-subject">${teacher.subject}</p>
            <p class="teacher-about">${teacher.about}</p>
            <a href="${teacher.link}" class="button secondary details-button">Подробнее</a>
        </div>
    `;

    // Дублируем список один раз [A] + [A]
    let slidesHTML = teachers.map(cardTemplate).join('');
    slidesHTML += teachers.map(cardTemplate).join(''); // Дубликат
    
    carouselElement.innerHTML = slidesHTML;
    
    initCarouselLogic(carouselElement, teachers.length);
}

function initCarouselLogic(carouselElement, realTotalSlides) {
    let currentSlideIndex = 0; 
    let autoScroll;
    let isTransitioning = false; 
    
    if (realTotalSlides === 0) return;

    let scrollAmountPx = 0;
    
    function updateScrollAmount() {
        const firstCard = carouselElement.querySelector('.teacher-card');
        if (!firstCard) return;
        
        const cardWidth = firstCard.offsetWidth;
        const carouselStyle = window.getComputedStyle(carouselElement);
        const gap = parseFloat(carouselStyle.gap) || 20; 
        
        scrollAmountPx = cardWidth + gap;
    }

    function applyTransform(smooth = true) {
        const offsetPx = currentSlideIndex * scrollAmountPx;
        
        carouselElement.style.transition = smooth 
            ? `transform ${TRANSITION_DURATION_MS}ms ease` 
            : 'none';
        
        carouselElement.style.transform = `translateX(-${offsetPx}px)`;
    }
    
    function checkAndWrap() {
        isTransitioning = false;
        
        if (currentSlideIndex >= realTotalSlides) {
            currentSlideIndex = 0; 
            applyTransform(false); 
        }
    }

    function startAutoScroll() {
        clearInterval(autoScroll); 
        autoScroll = setInterval(() => {
            navigate(1); 
        }, CAROUSEL_INTERVAL_MS);
    }
    
    const nextButton = document.querySelector('.next-button');
    const prevButton = document.querySelector('.prev-button');

    function navigate(direction) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        clearInterval(autoScroll);
        
        currentSlideIndex += direction;
        
        if (currentSlideIndex < 0) {
            currentSlideIndex = realTotalSlides; // Прыжок на конец первого блока для прокрутки назад
            applyTransform(false); // Мгновенный переход
            
            requestAnimationFrame(() => {
                currentSlideIndex--; // Затем анимируем на 1 шаг назад
                applyTransform(true);
                setTimeout(() => { isTransitioning = false; }, TRANSITION_DURATION_MS);
            });

        } else {
            applyTransform(true);
            setTimeout(checkAndWrap, TRANSITION_DURATION_MS);
        }
        
        startAutoScroll();
    }
    
    if (nextButton) nextButton.addEventListener('click', () => navigate(1));
    if (prevButton) prevButton.addEventListener('click', () => navigate(-1));
    
    updateScrollAmount();
    applyTransform(false); 
    startAutoScroll();

    window.addEventListener('resize', () => {
        updateScrollAmount();
        applyTransform(false); 
    });
}

// ====================================================================
// 4. ЛОГИКА НОВОСТЕЙ
// ====================================================================

function buildNewsSection(news, containerElement) {
    const newsHTML = news.map(item => `
        <div class="news-card">
            <a href="${item.link}">
                <img src="${item.image}" alt="Изображение к новости: ${item.title}">
            </a>
            <div class="news-content">
                <span class="news-date">${new Date(item.date).toLocaleDateString('ru-RU')}</span>
                <h4><a href="${item.link}">${item.title}</a></h4>
                <p>${item.snippet}</p>
            </div>
        </div>
    `).join('');
    
    containerElement.innerHTML = newsHTML;
}

// ====================================================================
// 5. НОВЫЕ АНИМАЦИИ И НЕОНОВЫЕ ЭФФЕКТЫ (только для темной темы на ПК)
// ====================================================================

function initNeonEffects() {
    const body = document.body;
    const isDarkMode = body.getAttribute('data-theme') === 'dark';

    // 1. Неоновый курсор-след
    let neonCursorTrail = document.querySelector('.neon-cursor-trail');
    if (!neonCursorTrail) {
        neonCursorTrail = document.createElement('div');
        neonCursorTrail.classList.add('neon-cursor-trail');
        body.appendChild(neonCursorTrail);
    }

    if (isDarkMode) {
        document.addEventListener('mousemove', (e) => {
            neonCursorTrail.style.left = `${e.clientX}px`;
            neonCursorTrail.style.top = `${e.clientY}px`;
            if (!neonCursorTrail.classList.contains('active')) {
                neonCursorTrail.classList.add('active');
                neonCursorTrail.classList.remove('inactive');
            }
        });
        document.addEventListener('mouseout', () => {
            neonCursorTrail.classList.add('inactive');
            neonCursorTrail.classList.remove('active');
        });

        // 2. Эффект неонового пламени для заголовков и кнопок
        const elementsWithFlameEffect = document.querySelectorAll(
            'h2, .logo, .button.secondary, .schedule-button, .carousel-button'
        );
        elementsWithFlameEffect.forEach(el => {
            // Убедимся, что эффект применяется только в темной теме
            if (isDarkMode) {
                el.classList.add('flame-effect-element');
            } else {
                el.classList.remove('flame-effect-element');
            }
        });

    } else {
        // Убираем эффекты, если тема не темная
        neonCursorTrail.classList.remove('active', 'inactive');
        document.removeEventListener('mousemove', (e) => {});
        document.removeEventListener('mouseout', () => {});

        document.querySelectorAll('.flame-effect-element').forEach(el => {
            el.classList.remove('flame-effect-element');
        });
    }
}