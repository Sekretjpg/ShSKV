// Константы для названий дней недели
const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

// Карта для сопоставления номеров дней (0=Вс, 1=Пн...) с названиями
const DAY_NAME_MAP = {
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница'
    // Выходные (0 и 6) исключены
};
// Определяем список учителей и предметы, которые они ведут 
const TEACHERS_MAP = {
    'Лариса.А': ['матем', 'алгебра', 'геометрия'],
    'Елена.В': ['русс-яз', 'литер'], 
    'Людмила.В': ['технология', 'физика',], 
    'Игорь.Х': ['история', 'ЧиО', 'ИРР'],
    // ДОБАВЬТЕ СЮДА СВОИХ УЧИТЕЛЕЙ
};

let schoolSchedule = {}; 

/**
 * Определяет текущий день недели (Понедельник, Вторник и т.д.)
 * @returns {string|null} Название текущего дня или null, если сегодня выходной.
 */
function getTodayName() {
    const todayIndex = new Date().getDay(); // 0 (Вс) - 6 (Сб)
    return DAY_NAME_MAP[todayIndex] || null;
}

// Шаг 1: Загрузка и парсинг JSON
async function loadSchedule() {
    try {
        console.log("Попытка загрузить lesson.json...");
        const response = await fetch('lesson.json');
        if (!response.ok) {
            throw new Error(`Не удалось загрузить lesson.json: Статус ${response.status}`);
        }
        const data = await response.json();
        schoolSchedule = data.Расписание; 
        console.log("Расписание успешно загружено.");
        
        populateSelectors();
        
        // Автоматический выбор "0" (опции по умолчанию) при загрузке
        const roleSelect = document.getElementById('role-select');
        if (roleSelect) {
            roleSelect.value = ''; 
            handleRoleChange();    
        }
        
    } catch (error) {
        console.error('КРИТИЧЕСКАЯ ОШИБКА: Ошибка загрузки или парсинга JSON.', error);
        document.getElementById('schedule-output').innerHTML = 
            'Ошибка загрузки расписания. Проверьте консоль (F12) для деталей.';
    }
}

// Шаг 2: Заполнение выпадающих списков
function populateSelectors() {
    // 1. Заполняем классы
    const classSelect = document.getElementById('class-select');
    if (classSelect) {
        classSelect.innerHTML = '<option value="">-- Выберите класс --</option>';
        Object.keys(schoolSchedule).forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className.replace('Класс_', 'Класс ');
            classSelect.appendChild(option);
        });
    }

    // 2. Заполняем учителей
    const teacherSelect = document.getElementById('teacher-select');
    if (!teacherSelect) return;
    
    teacherSelect.innerHTML = '<option value="">-- Выберите учителя --</option>';
    
    const teacherNames = Object.keys(TEACHERS_MAP);
    if (teacherNames.length === 0) return;

    teacherNames.forEach(teacherName => {
        const option = document.createElement('option');
        option.value = teacherName;
        option.textContent = teacherName;
        teacherSelect.appendChild(option);
    });
}

// Шаг 3: Обработка смены роли (Ученик/Учитель)
function handleRoleChange() {
    const role = document.getElementById('role-select').value;
    
    const studentControls = document.getElementById('student-controls');
    const teacherControls = document.getElementById('teacher-controls');
    const output = document.getElementById('schedule-output');

    // Скрываем оба блока и очищаем вывод
    if (studentControls) studentControls.classList.add('hidden');
    if (teacherControls) teacherControls.classList.add('hidden');
    if (output) output.innerHTML = 'Выберите класс или учителя.';

    if (role === 'Ученик') {
        if (studentControls) studentControls.classList.remove('hidden');
    } else if (role === 'Учитель') {
        if (Object.keys(TEACHERS_MAP).length > 0) {
            if (teacherControls) teacherControls.classList.remove('hidden');
        } else {
             if (output) output.innerHTML = 'Сначала заполните список учителей (TEACHERS_MAP) в script.js.';
        }
    }
}

// Шаг 4: Отображение расписания
function displaySchedule(role) {
    let scheduleData;
    let title;

    if (role === 'Ученик') {
        const selectedClass = document.getElementById('class-select').value;
        if (!selectedClass) {
            document.getElementById('schedule-output').innerHTML = 'Пожалуйста, выберите класс.';
            return;
        }
        scheduleData = schoolSchedule[selectedClass];
        title = `Расписание для ${selectedClass.replace('Класс_', 'Класс ')}`;
    } else if (role === 'Учитель') {
        const selectedTeacher = document.getElementById('teacher-select').value;
        if (!selectedTeacher) {
            document.getElementById('schedule-output').innerHTML = 'Пожалуйста, выберите учителя.';
            return;
        }
        scheduleData = generateTeacherSchedule(selectedTeacher);
        title = `Расписание для учителя ${selectedTeacher}`;
    }

    renderScheduleTable(scheduleData, title);
}

// Шаг 5: Генерация расписания для учителя (оптимизация: использование констант DAYS_OF_WEEK)
function generateTeacherSchedule(teacherName) {
    const subjects = TEACHERS_MAP[teacherName];
    const teacherSchedule = new Map(); 
    
    DAYS_OF_WEEK.forEach(day => {
        teacherSchedule.set(day, { Уроки: [], Начало: '8:00' });
    });

    for (const className in schoolSchedule) {
        const classData = schoolSchedule[className];
        
        DAYS_OF_WEEK.forEach(day => {
            const daySchedule = classData[day];
            
            if (daySchedule && daySchedule.Уроки && Array.isArray(daySchedule.Уроки)) {
                daySchedule.Уроки.forEach((lesson, index) => {
                    if (subjects.includes(lesson) && lesson !== '0') {
                        const currentDaySchedule = teacherSchedule.get(day);
                        currentDaySchedule.Уроки.push(`${className.replace('Класс_', 'кл.')}, ${index + 1} урок (${lesson})`);
                        // Нет необходимости использовать set, так как мы изменили объект по ссылке
                    }
                });
            }
        });
    }

    const finalSchedule = {};
    teacherSchedule.forEach((value, key) => {
        if (value.Уроки.length > 0) {
            finalSchedule[key] = value;
        }
    });

    return finalSchedule;
}

// Шаг 6: Рендеринг таблицы расписания (оптимизация: подсветка текущего дня)
function renderScheduleTable(data, title) {
    const outputElement = document.getElementById('schedule-output');
    if (!data || Object.keys(data).length === 0) {
        outputElement.innerHTML = `<h2>${title}</h2><p>Расписание не найдено или нет уроков в эти дни.</p>`;
        return;
    }
    
    const todayName = getTodayName(); // Получаем имя текущего дня

    let html = `<h2>${title}</h2>`;
    html += '<table>';
    html += '<thead><tr><th>День</th><th>Время</th><th>Уроки</th></tr></thead>';
    html += '<tbody>';

    DAYS_OF_WEEK.forEach(day => {
        const dayData = data[day];
        
        // Добавление класса 'today', если день совпадает с текущим
        const rowClass = day === todayName ? 'class="today"' : ''; 
        
        html += `<tr ${rowClass}>`;
        html += `<td>${day}</td>`;
        
        if (dayData && dayData.Уроки && dayData.Уроки.length > 0) {
            html += `<td>${dayData.Начало || 'Неизвестно'}</td>`;
            
            let lessonsList = '';
            if (title.includes('Расписание для Класс')) {
                lessonsList = dayData.Уроки.map((lesson, index) => `${index + 1}. ${lesson}`).join('<br>');
            } else {
                lessonsList = dayData.Уроки.join('<br>');
            }

            html += `<td>${lessonsList}</td>`;
        } else {
            html += `<td></td><td>Нет уроков</td>`; 
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    outputElement.innerHTML = html;
}

// Инициализация при загрузке страницы
loadSchedule();