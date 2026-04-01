"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var grammy_1 = require("grammy");
var fs = require("fs");
// ==========================================
// 1. КОНФІГУРАЦІЯ
// ==========================================
var CONFIG = {
    BOT_TOKEN: "8473334106:AAHVg3p_q7_M46bVLLFBr4QIAGmDhvcCD-U", // Обов'язково зміни токен після тестів!
    BOT_ADMINS: [5147076742],
    ALLOWED_RESOURCES: [
        -1002789684698, -1003200253794, -1002557455848, -1002563493364,
        -1003872064368, -1002808281023, 5147076742, 8296806565, 987654321,
        1122334455,
    ],
    ADMIN_CHAT_ID: -1002808281023,
    LOG_THREAD_ID: 3861,
    VIP_USERS: [8296806565, 987654321, 1122334455],
    DB_PATH: "./storage.json",
    // Оновлений текст із красивим HTML-форматуванням
    POST_TEXT: "<i>\u041D\u0410\u0413\u0410\u0414\u0423\u0412\u0410\u041D\u041D\u042F</i> \u0432\u0456\u0434 \u041C\u0443\u0440\u0443\u043C\u0456!\n\n\u0425\u043E\u0447\u0435\u0448 \u0442\u0443\u0442 \u0444\u0456\u0433\u0443\u0440\u043A\u0443? \n<b>\u041F\u0438\u0448\u0438 \u0411\u0440\u043E\u043D\u044C</b> + \u0441\u043A\u0440\u0456\u043D/\u043D\u0430\u0437\u0432\u0430 \u0443 \u043A\u043E\u043C\u0435\u043D\u0442\u0430\u0440\u044F\u0445! \n\n\u041E\u043F\u043B\u0430\u0442\u0430 \u0432\u0438\u043A\u043B\u044E\u0447\u043D\u043E \u043D\u0430 \u0424\u041E\u041F (\u0446\u0435 \u043E\u0444\u0456\u0446\u0456\u0439\u043D\u0438\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0431\u0456\u0437\u043D\u0435\u0441\u0443).\n\n<blockquote>\u041F\u0438\u0441\u0430\u0442\u0438 \u043F\u0440\u043E \u043E\u043F\u043B\u0430\u0442\u0443 \u043C\u043E\u0436\u0435 \u0422\u0406\u041B\u042C\u041A\u0418 @murumich. \n\n<prem>5429605292331533576+\uD83D\uDC8C</prem> \u0417\u0432'\u044F\u0437\u043E\u043A/\u0410\u0434\u043C\u0456\u043D: @murumich</blockquote>\n<u>\u0421\u043F\u0456\u043B\u043A\u0443\u0432\u0430\u043D\u043D\u044F \u043B\u0438\u0448\u0435 \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u043E\u044E.</u>",
};
// Функція для перетворення твого тегу в преміум-емодзі Telegram
var formatPremiumEmoji = function (text) {
    return text.replace(/<prem>(\d+)\+(.*?)<\/prem>/g, function (match, id, emoji) {
        return "<tg-emoji emoji-id=\"".concat(id, "\">").concat(emoji, "</tg-emoji>");
    });
};
var defaultData = {
    clicks: {},
    warnings: {},
    lastReset: new Date().toISOString(),
};
function initStorage() {
    if (!fs.existsSync(CONFIG.DB_PATH)) {
        console.log("🐾 Створюю новий файл бази даних storage.json...");
        saveStorage(defaultData);
    }
}
function loadStorage() {
    try {
        if (!fs.existsSync(CONFIG.DB_PATH)) {
            initStorage();
        }
        var data = fs.readFileSync(CONFIG.DB_PATH, "utf-8");
        return JSON.parse(data);
    }
    catch (e) {
        console.error("Помилка читання бази, повертаю дефолт:", e);
        return defaultData;
    }
}
function saveStorage(data) {
    fs.writeFileSync(CONFIG.DB_PATH, JSON.stringify(data, null, 2));
}
// ==========================================
// 3. ЛОГІКА ТА КЛАВІАТУРИ
// ==========================================
var checker = {
    hasRussian: function (text) {
        return /[ёъыэ]/i.test(text);
    },
    getPostKeyboard: function () {
        return new grammy_1.InlineKeyboard()
            .url("Відгуки 📝", "https://t.me/infomurumi/7")
            .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
            .row()
            .url("Як це працює? 🗺", "https://t.me/murumishop/106")
            .url("Канал з посилками 📦", "https://t.me/deliverymurumi")
            .row()
            .url("Наш Чатик", "https://t.me/infomurumi");
    },
};
// ==========================================
// 4. ГОЛОВНА ЛОГІКА БОТА
// ==========================================
initStorage(); // Ініціалізуємо БД при старті
var bot = new grammy_1.Bot(CONFIG.BOT_TOKEN);
// Кеш для збереження ID альбомів (media_group_id), щоб не відповідати на кожне фото
var processedMediaGroups = new Set();
// 4.1. Контроль чатів (Забороняємо ліві групи)
bot.on("message", function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var isAllowed, isAdminChat, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                isAllowed = CONFIG.ALLOWED_RESOURCES.includes(ctx.chat.id);
                isAdminChat = ctx.chat.id === CONFIG.ADMIN_CHAT_ID;
                if (!(!isAllowed && !isAdminChat)) return [3 /*break*/, 5];
                console.log("\u0421\u043F\u0440\u043E\u0431\u0430 \u0434\u043E\u0434\u0430\u0442\u0438 \u0432 \u043B\u0456\u0432\u0438\u0439 \u0447\u0430\u0442: ".concat(ctx.chat.id, ". \u041B\u0456\u0432\u0430\u044E..."));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, ctx.leaveChat()];
            case 2:
                _a.sent();
                console.log("\u0423\u0441\u043F\u0456\u0448\u043D\u043E \u0432\u0438\u0439\u0448\u043E\u0432 \u0437 \u0447\u0430\u0442\u0443 ".concat(ctx.chat.id));
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.log("\u041D\u0435 \u0437\u043C\u0456\u0433 \u0432\u0438\u0439\u0442\u0438 \u0437 ".concat(ctx.chat.id, ". \u0406\u0433\u043D\u043E\u0440\u0443\u0454\u043C\u043E."));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
            case 5: return [4 /*yield*/, next()];
            case 6:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// 4.1.5. Роздача сердечок VIP-користувачам
// ==========================================
bot.on("message", function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, e_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
                if (!(userId && CONFIG.VIP_USERS.includes(userId))) return [3 /*break*/, 4];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                // Ставимо сердечко (можеш змінити емодзі на 💘, 🍓, 💅 тощо)
                return [4 /*yield*/, ctx.react("💘")];
            case 2:
                // Ставимо сердечко (можеш змінити емодзі на 💘, 🍓, 💅 тощо)
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                e_2 = _b.sent();
                console.error("\u041D\u0435 \u0437\u043C\u0456\u0433 \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u0440\u0435\u0430\u043A\u0446\u0456\u044E \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0443 ".concat(userId));
                return [3 /*break*/, 4];
            case 4: 
            // Обов'язково викликаємо next(), щоб бот не зупинився
            // і пішов перевіряти мову чи інші команди далі!
            return [4 /*yield*/, next()];
            case 5:
                // Обов'язково викликаємо next(), щоб бот не зупинився
                // і пішов перевіряти мову чи інші команди далі!
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
// 4.2. Команда перевірки (Мур -> Мяу)
bot.hears(/^[Мм]ур[!?.]*$/i, function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.reply("Мяу 🐾", {
                    reply_parameters: { message_id: ctx.msg.message_id },
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Команда для ручного додавання кнопок до старих постів
bot.command("postREP", function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, args, chatId, messageId, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
                // 1. Перевірка прав (Дропаємо всіх, кого немає в масиві BOT_ADMINS)
                if (!userId || !CONFIG.BOT_ADMINS.includes(userId)) {
                    return [2 /*return*/]; // Бот мовчки ігнорує
                }
                args = ctx.match.split(" ");
                if (!(args.length !== 2)) return [3 /*break*/, 2];
                return [4 /*yield*/, ctx.reply("❌ Неправильний формат.\nВикористовуй: <code>/postREP -100xxxxxx message_id</code>", {
                        parse_mode: "HTML",
                        reply_parameters: { message_id: ctx.msg.message_id }, // <--- Реплай на команду
                    })];
            case 1:
                _b.sent();
                return [2 /*return*/];
            case 2:
                chatId = Number(args[0]);
                messageId = Number(args[1]);
                if (!(isNaN(chatId) || isNaN(messageId))) return [3 /*break*/, 4];
                return [4 /*yield*/, ctx.reply("❌ ID чату та ID повідомлення мають бути числами!", {
                        reply_parameters: { message_id: ctx.msg.message_id }, // <--- Реплай на команду
                    })];
            case 3:
                _b.sent();
                return [2 /*return*/];
            case 4:
                _b.trys.push([4, 7, , 9]);
                return [4 /*yield*/, ctx.api.sendMessage(chatId, formatPremiumEmoji(CONFIG.POST_TEXT), {
                        reply_parameters: { message_id: messageId },
                        reply_markup: checker.getPostKeyboard(),
                        parse_mode: "HTML",
                    })];
            case 5:
                _b.sent();
                // Відповідаємо адміну, що все вийшло (з реплаєм на команду)
                return [4 /*yield*/, ctx.reply("\u2705 \u041A\u043D\u043E\u043F\u043A\u0438 \u0443\u0441\u043F\u0456\u0448\u043D\u043E \u0434\u043E\u0434\u0430\u043D\u043E \u0434\u043E \u043F\u043E\u0441\u0442\u0443 <code>".concat(messageId, "</code>!"), {
                        parse_mode: "HTML",
                        reply_parameters: { message_id: ctx.msg.message_id }, // <--- Реплай на команду
                    })];
            case 6:
                // Відповідаємо адміну, що все вийшло (з реплаєм на команду)
                _b.sent();
                return [3 /*break*/, 9];
            case 7:
                error_1 = _b.sent();
                console.error("Помилка при додаванні до старого посту:", error_1);
                return [4 /*yield*/, ctx.reply("❌ Помилка API. Перевір, чи правильні ID та чи є бот у тому чаті з правами адміна.", { reply_parameters: { message_id: ctx.msg.message_id } })];
            case 8:
                _b.sent();
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// 4.3. АВТОВІДПОВІДЬ В ЧАТІ НА ПОСТИ З КАНАЛУ
bot.on("message", function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var channelId, mediaGroupId_1, e_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(((_a = ctx.msg.sender_chat) === null || _a === void 0 ? void 0 : _a.type) === "channel")) return [3 /*break*/, 5];
                channelId = ctx.msg.sender_chat.id;
                if (!CONFIG.ALLOWED_RESOURCES.includes(channelId)) return [3 /*break*/, 4];
                mediaGroupId_1 = ctx.msg.media_group_id;
                if (mediaGroupId_1) {
                    if (processedMediaGroups.has(mediaGroupId_1))
                        return [2 /*return*/];
                    // Запам'ятовуємо цей альбом і видаляємо з пам'яті через 60 секунд
                    processedMediaGroups.add(mediaGroupId_1);
                    setTimeout(function () { return processedMediaGroups.delete(mediaGroupId_1); }, 60000);
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, ctx.reply(formatPremiumEmoji(CONFIG.POST_TEXT), {
                        reply_parameters: { message_id: ctx.msg.message_id },
                        reply_markup: checker.getPostKeyboard(),
                        parse_mode: "HTML",
                    })];
            case 2:
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                e_3 = _b.sent();
                console.error("Помилка при надсиланні кнопок під пост:", e_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
            case 5: return [4 /*yield*/, next()];
            case 6:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
// 4.4. Авто-відповідь, якщо бота додали ПРЯМО В КАНАЛ (як адміна)
bot.on("channel_post", function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var mediaGroupId_2, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!CONFIG.ALLOWED_RESOURCES.includes(ctx.chat.id)) return [3 /*break*/, 4];
                mediaGroupId_2 = ctx.msg.media_group_id;
                if (mediaGroupId_2) {
                    if (processedMediaGroups.has(mediaGroupId_2))
                        return [2 /*return*/];
                    processedMediaGroups.add(mediaGroupId_2);
                    setTimeout(function () { return processedMediaGroups.delete(mediaGroupId_2); }, 60000);
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, ctx.reply(formatPremiumEmoji(CONFIG.POST_TEXT), {
                        reply_markup: checker.getPostKeyboard(),
                        parse_mode: "HTML",
                    })];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                console.error("Помилка при надсиланні посту:", e_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// 4.5. Обробка кліків на кнопки
bot.on("callback_query:data", function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var data, key;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = loadStorage();
                key = ctx.callbackQuery.data;
                data.clicks[key] = (data.clicks[key] || 0) + 1;
                saveStorage(data);
                return [4 /*yield*/, ctx.answerCallbackQuery("Дякуємо, що читаєте! Мур-мяу 🐾")];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// 4.6. Мовний патруль
bot.on("message:text", function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, db, cleanChatId, err_1, err_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if ((_a = ctx.from) === null || _a === void 0 ? void 0 : _a.is_bot)
                    return [2 /*return*/];
                if (ctx.chat.id === CONFIG.ADMIN_CHAT_ID)
                    return [2 /*return*/];
                if (!checker.hasRussian(ctx.msg.text)) return [3 /*break*/, 9];
                userId = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id;
                if (!userId)
                    return [2 /*return*/];
                db = loadStorage();
                db.warnings[userId] = (db.warnings[userId] || 0) + 1;
                saveStorage(db);
                if (!(db.warnings[userId] >= 3)) return [3 /*break*/, 5];
                cleanChatId = ctx.chat.id.toString().replace("-100", "");
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, bot.api.sendMessage(CONFIG.ADMIN_CHAT_ID, "\uD83D\uDEA8 **\u041F\u041E\u0420\u0423\u0428\u0415\u041D\u041D\u042F \u041C\u041E\u0412\u041D\u0418\u0425 \u041F\u0420\u0410\u0412\u0418\u041B**\n\n" +
                        "\uD83D\uDC64 **\u041A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447:** ".concat(ctx.from.first_name, " (@").concat(ctx.from.username || "немає", ")\n") +
                        "\uD83C\uDD94 **ID:** `".concat(userId, "`\n") +
                        "\u23F0 **\u0427\u0430\u0441:** ".concat(new Date().toLocaleString("uk-UA"), "\n") +
                        "\uD83D\uDD17 [\u041F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u043D\u0430 \u043F\u043E\u0432\u0456\u0434\u043E\u043C\u043B\u0435\u043D\u043D\u044F](https://t.me/c/".concat(cleanChatId, "/").concat(ctx.msg.message_id, ")"), {
                        message_thread_id: CONFIG.LOG_THREAD_ID,
                        parse_mode: "Markdown",
                    })];
            case 2:
                _c.sent();
                return [3 /*break*/, 4];
            case 3:
                err_1 = _c.sent();
                console.error("Не зміг відправити звіт в адмін чат.");
                return [3 /*break*/, 4];
            case 4: return [3 /*break*/, 9];
            case 5:
                _c.trys.push([5, 7, , 9]);
                return [4 /*yield*/, ctx.reply("\u0410\u0439-\u0430\u0439-\u0430\u0439, ".concat(ctx.from.first_name, ", \u0432 \u0446\u044C\u043E\u043C\u0443 \u0447\u0430\u0442\u0456 \u043D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0441\u043F\u0456\u043B\u043A\u0443\u0432\u0430\u0442\u0438\u0441\u044C \u0440\u043E\u0441\u0456\u0439\u0441\u044C\u043A\u043E\u044E. \u0423\u0441\u043D\u0435 \u043F\u043E\u043F\u0435\u0440\u0435\u0434\u0436\u0435\u043D\u043D\u044F! (").concat(db.warnings[userId], "/3)"), { reply_parameters: { message_id: ctx.msg.message_id } })];
            case 6:
                _c.sent();
                return [3 /*break*/, 9];
            case 7:
                err_2 = _c.sent();
                return [4 /*yield*/, ctx.reply("\u0410\u0439-\u0430\u0439-\u0430\u0439, ".concat(ctx.from.first_name, ", \u0432 \u0446\u044C\u043E\u043C\u0443 \u0447\u0430\u0442\u0456 \u043D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0441\u043F\u0456\u043B\u043A\u0443\u0432\u0430\u0442\u0438\u0441\u044C \u0440\u043E\u0441\u0456\u0439\u0441\u044C\u043A\u043E\u044E. \u0423\u0441\u043D\u0435 \u043F\u043E\u043F\u0435\u0440\u0435\u0434\u0436\u0435\u043D\u043D\u044F! (").concat(db.warnings[userId], "/3)"))];
            case 8:
                _c.sent();
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// 4.7. Звіт та обнулення кожні 24 години
setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
    var db, now, lastReset, report, _i, _a, _b, btn, count, err_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                db = loadStorage();
                now = new Date();
                lastReset = new Date(db.lastReset);
                if (!(now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000)) return [3 /*break*/, 5];
                report = "📈 **ДОБОВИЙ ЗВІТ ПО КЛІКАХ**\n\n";
                if (Object.keys(db.clicks).length === 0) {
                    report += "Сьогодні ніхто нікуди не тицяв 😿";
                }
                else {
                    for (_i = 0, _a = Object.entries(db.clicks); _i < _a.length; _i++) {
                        _b = _a[_i], btn = _b[0], count = _b[1];
                        report += "\uD83D\uDD39 **".concat(btn, "**: ").concat(count, " \u0440\u0430\u0437\u0456\u0432\n");
                    }
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, bot.api.sendMessage(CONFIG.ADMIN_CHAT_ID, report, {
                        message_thread_id: CONFIG.LOG_THREAD_ID,
                        parse_mode: "Markdown",
                    })];
            case 2:
                _c.sent();
                return [3 /*break*/, 4];
            case 3:
                err_3 = _c.sent();
                console.error("Не зміг відправити добовий звіт:", err_3);
                return [3 /*break*/, 4];
            case 4:
                db.clicks = {};
                db.lastReset = now.toISOString();
                saveStorage(db);
                _c.label = 5;
            case 5: return [2 /*return*/];
        }
    });
}); }, 60000);
// Глобальний обробник помилок
bot.catch(function (err) {
    var ctx = err.ctx;
    console.error("[\u041F\u043E\u043C\u0438\u043B\u043A\u0430] \u0410\u043F\u0434\u0435\u0439\u0442 ".concat(ctx.update.update_id, ":"));
    var e = err.error;
    if (e instanceof grammy_1.GrammyError) {
        console.error("Помилка від Telegram:", e.description);
    }
    else if (e instanceof grammy_1.HttpError) {
        console.error("Немає зв'язку з Telegram:", e);
    }
    else {
        console.error("Невідома помилка:", e);
    }
});
// Запуск бота
bot.start();
console.log("Мур-бот успішно запущений! 🚀");
