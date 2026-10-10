// Quiz logic
const quizData = {
    answers: {},
    currentStep: 0,
    totalSteps: 4
};

// Услуги салона
const services = {
    manicure: {
        name: 'Маникюр',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>`,
        description: 'Классический, аппаратный и комбинированный маникюр с покрытием гель-лаком',
        price: 'от 1200₽'
    },
    pedicure: {
        name: 'Педикюр',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>`,
        description: 'Аппаратный и комбинированный педикюр, профессиональный уход за стопами',
        price: 'от 1500₽'
    },
    facial: {
        name: 'Уход за лицом',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4"></circle>
            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
        </svg>`,
        description: 'Чистка, пилинги, массаж и антивозрастные программы',
        price: 'от 800₽'
    },
    brows: {
        name: 'Брови и ресницы',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`,
        description: 'Оформление бровей, окрашивание, ламинирование и наращивание ресниц',
        price: 'от 400₽'
    },
    makeup: {
        name: 'Макияж',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>`,
        description: 'Дневной, вечерний и свадебный макияж от профессионального визажиста',
        price: 'от 1000₽'
    },
    massage: {
        name: 'Массаж',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>`,
        description: 'Массаж лица, шеи и зоны декольте, релаксирующие техники',
        price: 'от 600₽'
    }
};

function startQuiz() {
    quizData.currentStep = 1;
    updateProgress();
    showScreen('screen-q1');
}

function answer(question, value) {
    quizData.answers[question] = value;

    const nextStep = quizData.currentStep + 1;

    if (nextStep <= quizData.totalSteps) {
        quizData.currentStep = nextStep;
        updateProgress();
        showScreen(`screen-q${nextStep}`);
    } else {
        showResults();
    }
}

function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.quiz-screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Показываем нужный экран
    document.getElementById(screenId).classList.add('active');
}

function updateProgress() {
    const progress = (quizData.currentStep / quizData.totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function getRecommendations() {
    const { q1, q2, q3, q4 } = quizData.answers;
    const recommendations = [];

    // Логика рекомендаций на основе ответов

    // Бюджет
    if (q3 === 'low') {
        recommendations.push('brows', 'massage');
    } else if (q3 === 'medium') {
        recommendations.push('manicure', 'facial');
    } else if (q3 === 'high') {
        recommendations.push('manicure', 'pedicure', 'makeup');
    } else {
        recommendations.push('facial', 'manicure');
    }

    // Цель
    if (q2 === 'special') {
        if (!recommendations.includes('makeup')) {
            recommendations.unshift('makeup');
        }
    } else if (q2 === 'transformation') {
        recommendations.push('facial', 'makeup');
    }

    // Опыт
    if (q1 === 'first') {
        recommendations.unshift('facial');
    }

    // Удаляем дубликаты и ограничиваем до 3
    return [...new Set(recommendations)].slice(0, 3);
}

function showResults() {
    quizData.currentStep = quizData.totalSteps;
    updateProgress();

    const recommendations = getRecommendations();
    const resultContent = document.getElementById('resultContent');

    let html = '';
    recommendations.forEach(serviceKey => {
        const service = services[serviceKey];
        html += `
            <div class="result-card">
                <div class="result-icon">${service.icon}</div>
                <div class="result-info">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="result-price">${service.price}</div>
                </div>
            </div>
        `;
    });

    resultContent.innerHTML = html;
    showScreen('screen-result');
}

function restartQuiz() {
    quizData.answers = {};
    quizData.currentStep = 0;
    updateProgress();
    showScreen('screen-start');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
});
