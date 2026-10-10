const TelegramBot = require('node-telegram-bot-api');

// Замените на ваш токен от @BotFather
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Хранилище данных пользователей
const userSessions = new Map();

// Услуги салона
const services = {
    manicure: { name: '💅 Маникюр', price: 'от 1200₽' },
    pedicure: { name: '🦶 Педикюр', price: 'от 1500₽' },
    facial: { name: '✨ Уход за лицом', price: 'от 800₽' },
    brows: { name: '👁️ Брови и ресницы', price: 'от 400₽' },
    makeup: { name: '💄 Макияж', price: 'от 1000₽' },
    massage: { name: '💆 Массаж', price: 'от 600₽' }
};

// Время записи
const timeSlots = [
    '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00'
];

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'Гость';

    userSessions.set(chatId, { step: 'welcome' });

    const welcomeMessage = `
👋 Здравствуйте, ${userName}!

Добро пожаловать в салон красоты **Аврора**!

Я помогу вам записаться на процедуру. Давайте начнем с небольшого опроса, чтобы подобрать идеальную услугу.

Готовы начать? 😊
    `;

    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✨ Начать запись', callback_data: 'start_booking' }],
                [{ text: '📋 Прайс-лист', callback_data: 'show_prices' }],
                [{ text: '📞 Контакты', callback_data: 'show_contacts' }]
            ]
        }
    });
});

// Обработка callback запросов
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const messageId = query.message.message_id;

    await bot.answerCallbackQuery(query.id);

    // Начало записи (квиз)
    if (data === 'start_booking') {
        userSessions.set(chatId, { step: 'quiz_1', answers: {} });

        bot.editMessageText(
            '❓ Вопрос 1/4\n\nВы посещали салон красоты раньше?',
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Да, регулярно', callback_data: 'quiz1_regular' }],
                        [{ text: 'Да, иногда', callback_data: 'quiz1_sometimes' }],
                        [{ text: 'Нет, первый раз', callback_data: 'quiz1_first' }]
                    ]
                }
            }
        );
    }

    // Квиз - Вопрос 1
    else if (data.startsWith('quiz1_')) {
        const session = userSessions.get(chatId);
        session.answers.experience = data.replace('quiz1_', '');
        session.step = 'quiz_2';

        bot.editMessageText(
            '❓ Вопрос 2/4\n\nКакой результат вы хотите получить?',
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🌟 Повседневный уход', callback_data: 'quiz2_daily' }],
                        [{ text: '✨ Особый случай', callback_data: 'quiz2_special' }],
                        [{ text: '💎 Полное преображение', callback_data: 'quiz2_transformation' }]
                    ]
                }
            }
        );
    }

    // Квиз - Вопрос 2
    else if (data.startsWith('quiz2_')) {
        const session = userSessions.get(chatId);
        session.answers.goal = data.replace('quiz2_', '');
        session.step = 'quiz_3';

        bot.editMessageText(
            '❓ Вопрос 3/4\n\nКакой у вас бюджет на процедуру?',
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'До 1000₽', callback_data: 'quiz3_low' }],
                        [{ text: '1000-2000₽', callback_data: 'quiz3_medium' }],
                        [{ text: 'Более 2000₽', callback_data: 'quiz3_high' }],
                        [{ text: 'Не важно', callback_data: 'quiz3_any' }]
                    ]
                }
            }
        );
    }

    // Квиз - Вопрос 3
    else if (data.startsWith('quiz3_')) {
        const session = userSessions.get(chatId);
        session.answers.budget = data.replace('quiz3_', '');
        session.step = 'quiz_4';

        bot.editMessageText(
            '❓ Вопрос 4/4\n\nВ какое время вам удобнее приходить?',
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🌅 Утро (10:00-12:00)', callback_data: 'quiz4_morning' }],
                        [{ text: '☀️ День (12:00-15:00)', callback_data: 'quiz4_afternoon' }],
                        [{ text: '🌆 Вечер (15:00-19:00)', callback_data: 'quiz4_evening' }],
                        [{ text: '⏰ Любое', callback_data: 'quiz4_any' }]
                    ]
                }
            }
        );
    }

    // Квиз - Вопрос 4 (последний)
    else if (data.startsWith('quiz4_')) {
        const session = userSessions.get(chatId);
        session.answers.time_preference = data.replace('quiz4_', '');

        // Рекомендуем услуги на основе ответов
        const recommendations = getRecommendations(session.answers);

        bot.editMessageText(
            `✅ Отлично! На основе ваших ответов, мы рекомендуем:\n\n${recommendations}\n\nВыберите услугу для записи:`,
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: services.manicure.name, callback_data: 'service_manicure' }],
                        [{ text: services.pedicure.name, callback_data: 'service_pedicure' }],
                        [{ text: services.facial.name, callback_data: 'service_facial' }],
                        [{ text: services.brows.name, callback_data: 'service_brows' }],
                        [{ text: services.makeup.name, callback_data: 'service_makeup' }],
                        [{ text: services.massage.name, callback_data: 'service_massage' }]
                    ]
                }
            }
        );

        session.step = 'select_service';
    }

    // Выбор услуги
    else if (data.startsWith('service_')) {
        const session = userSessions.get(chatId);
        const serviceKey = data.replace('service_', '');
        session.selectedService = serviceKey;
        session.step = 'select_date';

        bot.editMessageText(
            `✅ Выбрана услуга: ${services[serviceKey].name}\nЦена: ${services[serviceKey].price}\n\nВыберите дату записи:`,
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: generateDateKeyboard()
            }
        );
    }

    // Выбор даты
    else if (data.startsWith('date_')) {
        const session = userSessions.get(chatId);
        session.selectedDate = data.replace('date_', '');
        session.step = 'select_time';

        bot.editMessageText(
            `📅 Дата: ${session.selectedDate}\n\nВыберите время:`,
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: generateTimeKeyboard()
            }
        );
    }

    // Выбор времени
    else if (data.startsWith('time_')) {
        const session = userSessions.get(chatId);
        session.selectedTime = data.replace('time_', '');
        session.step = 'enter_name';

        bot.sendMessage(
            chatId,
            '👤 Отлично! Теперь напишите ваше имя:'
        );
    }

    // Показать прайс-лист
    else if (data === 'show_prices') {
        const priceList = Object.values(services)
            .map(s => `${s.name} — ${s.price}`)
            .join('\n');

        bot.editMessageText(
            `💰 **Прайс-лист**\n\n${priceList}\n\nГотовы записаться?`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✨ Записаться', callback_data: 'start_booking' }],
                        [{ text: '⬅️ Назад', callback_data: 'back_to_start' }]
                    ]
                }
            }
        );
    }

    // Показать контакты
    else if (data === 'show_contacts') {
        bot.editMessageText(
            `📞 **Контакты салона Аврора**\n\n📍 Адрес: г. Москва, ул. Тверская, 25, БЦ "Премьер", 3 этаж\n\n📞 Телефоны:\n+7 (916) 123-45-67\n+7 (495) 987-65-43\n\n📧 Email: info@aurora-salon.ru\n\n⏰ Режим работы:\nПн-Сб: 10:00 - 20:00\nВс: 11:00 - 18:00`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✨ Записаться', callback_data: 'start_booking' }],
                        [{ text: '⬅️ Назад', callback_data: 'back_to_start' }]
                    ]
                }
            }
        );
    }

    // Вернуться к началу
    else if (data === 'back_to_start') {
        bot.deleteMessage(chatId, messageId);
        bot.sendMessage(chatId, '/start');
    }
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Игнорируем команды
    if (text && text.startsWith('/')) return;

    const session = userSessions.get(chatId);
    if (!session) return;

    // Ввод имени
    if (session.step === 'enter_name') {
        session.userName = text;
        session.step = 'enter_phone';

        bot.sendMessage(
            chatId,
            '📱 Отлично! Теперь напишите ваш номер телефона:\n(например: +7 916 123-45-67)'
        );
    }

    // Ввод телефона
    else if (session.step === 'enter_phone') {
        session.userPhone = text;
        session.step = 'confirmation';

        // Формируем итоговое сообщение
        const summary = `
✅ **Ваша запись**

👤 Имя: ${session.userName}
📱 Телефон: ${session.userPhone}

💅 Услуга: ${services[session.selectedService].name}
💰 Цена: ${services[session.selectedService].price}

📅 Дата: ${session.selectedDate}
⏰ Время: ${session.selectedTime}

Подтвердите запись:
        `;

        bot.sendMessage(chatId, summary, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Подтвердить', callback_data: 'confirm_booking' }],
                    [{ text: '❌ Отменить', callback_data: 'cancel_booking' }]
                ]
            }
        });
    }
});

// Подтверждение записи
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'confirm_booking') {
        await bot.answerCallbackQuery(query.id, { text: 'Запись подтверждена!' });

        bot.sendMessage(
            chatId,
            `🎉 Отлично! Ваша запись подтверждена!\n\nМы ждем вас в салоне Аврора.\nЗа день до визита мы напомним вам о записи.\n\nСпасибо, что выбрали нас! ✨`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏠 В начало', callback_data: 'back_to_start' }]
                    ]
                }
            }
        );

        // Здесь можно добавить сохранение в базу данных
        console.log('Новая запись:', userSessions.get(chatId));

        userSessions.delete(chatId);
    }

    else if (data === 'cancel_booking') {
        await bot.answerCallbackQuery(query.id, { text: 'Запись отменена' });

        bot.sendMessage(
            chatId,
            '❌ Запись отменена. Вы можете начать заново.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔄 Начать заново', callback_data: 'start_booking' }]
                    ]
                }
            }
        );

        userSessions.delete(chatId);
    }
});

// Функция рекомендаций на основе квиза
function getRecommendations(answers) {
    let recommendations = [];

    if (answers.budget === 'low') {
        recommendations.push('💅 Маникюр или 👁️ Брови и ресницы');
    } else if (answers.budget === 'medium') {
        recommendations.push('💅 Маникюр + дизайн, ✨ Уход за лицом');
    } else {
        recommendations.push('💎 Комплексный уход: Маникюр + Педикюр, 💄 Макияж');
    }

    if (answers.goal === 'special') {
        recommendations.push('💄 Макияж для особого случая');
    }

    if (answers.experience === 'first') {
        recommendations.push('✨ Консультация мастера + базовый уход');
    }

    return recommendations.join('\n🔹 ');
}

// Генерация клавиатуры с датами
function generateDateKeyboard() {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        const dayStr = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        dates.push([{
            text: `${dateStr} (${dayStr})`,
            callback_data: `date_${dateStr}`
        }]);
    }

    return { inline_keyboard: dates };
}

// Генерация клавиатуры со временем
function generateTimeKeyboard() {
    const times = timeSlots.map(time => [{
        text: time,
        callback_data: `time_${time}`
    }]);

    // Разбиваем на строки по 3 кнопки
    const keyboard = [];
    for (let i = 0; i < times.length; i += 3) {
        keyboard.push(times.slice(i, i + 3).flat());
    }

    return { inline_keyboard: keyboard };
}

console.log('🤖 Бот салона красоты Аврора запущен!');
