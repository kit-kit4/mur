"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var grammy_1 = require("grammy");
var fs = require("fs");
var os = require("os");
var child_process_1 = require("child_process");
// 🐱 Налаштування МУР-бота
var MUR_CONFIG = {
  name: "Мур-БОТ",
  token: "8473334106:AAHVg3p_q7_M46bVLLFBr4QIAGmDhvcCD-U", // Обов'язково зміни токен після тестів!
  admins: [5147076742],
  allowedResources: [
    -1002789684698, -1003200253794, -1002557455848, -1002563493364,
    -1003872064368, -1002808281023, 5147076742, 8296806565, 987654321,
  ],
  adminChatId: -1002808281023,
  vipUsers: [8296806565, 987654321, 5147076742],
  threads: {
    uptime: 530,
    hosting: 3986,
    db: 3986,
    logs: 3861,
    clicks: 10,
  },
  dbPath: "./mur_storage.json",
  postText:
    "<i>\u041D\u0410\u0413\u0410\u0414\u0423\u0412\u0410\u041D\u041D\u042F</i> \u0432\u0456\u0434 \u041C\u0443\u0440\u0443\u043C\u0456!\n\n\u0425\u043E\u0447\u0435\u0448 \u0442\u0443\u0442 \u0444\u0456\u0433\u0443\u0440\u043A\u0443? \n<b>\u041F\u0438\u0448\u0438 \u0411\u0440\u043E\u043D\u044C</b> + \u0441\u043A\u0440\u0456\u043D/\u043D\u0430\u0437\u0432\u0430 \u0443 \u043A\u043E\u043C\u0435\u043D\u0442\u0430\u0440\u044F\u0445! \n\n\u041E\u043F\u043B\u0430\u0442\u0430 \u0432\u0438\u043A\u043B\u044E\u0447\u043D\u043E \u043D\u0430 \u0424\u041E\u041F (\u0446\u0435 \u043E\u0444\u0456\u0446\u0456\u0439\u043D\u0438\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0431\u0456\u0437\u043D\u0435\u0441\u0443).\n\n<blockquote>\u041F\u0438\u0441\u0430\u0442\u0438 \u043F\u0440\u043E \u043E\u043F\u043B\u0430\u0442\u0443 \u043C\u043E\u0436\u0435 \u0422\u0406\u041B\u042C\u041A\u0418 @murumich. \n\n<prem>5429605292331533576+\uD83D\uDC8C</prem> \u0417\u0432'\u044F\u0437\u043E\u043A/\u0410\u0434\u043C\u0456\u043D: @murumich</blockquote>\n<u>\u0421\u043F\u0456\u043B\u043A\u0443\u0432\u0430\u043D\u043D\u044F \u043B\u0438\u0448\u0435 \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u043E\u044E.</u>",
};
// 🦊 Налаштування ШІГІ-бота (Заглушка)
var SHIGI_CONFIG = {
  name: "Шігі-БОТ",
  token: "ТОКЕН_ШІГІ_ТУТ",
  admins: [5147076742],
  allowedResources: [-1001111111111],
  adminChatId: -1001111111111,
  vipUsers: [],
  threads: {
    uptime: 1,
    hosting: 1,
    db: 1,
    logs: 1,
    clicks: 1,
  },
  dbPath: "./shigi_storage.json",
  postText:
    "<i>\u041D\u0410\u0413\u0410\u0414\u0423\u0412\u0410\u041D\u041D\u042F</i> \u0432\u0456\u0434 \u0428\u0456\u0433\u0456!\n\n\u0422\u0443\u0442 \u0456\u043D\u0448\u0438\u0439 \u0442\u0435\u043A\u0441\u0442...",
};
// ==========================================
// 2. СИСТЕМНІ УТИЛІТИ ТА ЕМОДЗІ
// ==========================================
var formatPremiumEmoji = function (text) {
  return text.replace(/<prem>(\d+)\+(.*?)<\/prem>/g, function (m, id, emo) {
    return '<tg-emoji emoji-id="'.concat(id, '">').concat(emo, "</tg-emoji>");
  });
};
var hasRussian = function (text) {
  return /[ёъыэ]/i.test(text);
};
var getSystemInfo = function () {
  var totalRam = (os.totalmem() / Math.pow(1024, 3)).toFixed(2);
  var freeRam = (os.freemem() / Math.pow(1024, 3)).toFixed(2);
  var usedRam = (Number(totalRam) - Number(freeRam)).toFixed(2);
  var ramPercent = ((Number(usedRam) / Number(totalRam)) * 100).toFixed(0);
  var ssdInfo = "Локальний тест (Windows)";
  // Команда df працює тільки на Linux (на твоєму хостингу)
  if (os.platform() !== "win32") {
    try {
      var df = (0, child_process_1.execSync)("df -h / | tail -1")
        .toString()
        .trim()
        .split(/\s+/);
      ssdInfo = "\u0412\u0436\u0438\u0432\u0430\u043D\u043E "
        .concat(df[2], " / \u0412\u0456\u043B\u044C\u043D\u043E ")
        .concat(df[3], " (\u0417\u0430\u0433\u0430\u043B\u043E\u043C ")
        .concat(df[1], ")");
    } catch (e) {
      ssdInfo = "Помилка читання SSD";
    }
  }
  return {
    ram: "\u0412\u0436\u0438\u0432\u0430\u043D\u043E "
      .concat(usedRam, "GB / ")
      .concat(totalRam, "GB (")
      .concat(ramPercent, "%)"),
    ssd: ssdInfo,
  };
};
// ==========================================
// 3. ФАБРИКА БОТІВ
// ==========================================
function startBot(config) {
  var _this = this;
  var bot = new grammy_1.Bot(config.token);
  var processedMediaGroups = new Set();
  var initDb = function () {
    if (!fs.existsSync(config.dbPath))
      fs.writeFileSync(
        config.dbPath,
        JSON.stringify({
          clicks: {},
          warnings: {},
          lastReset: new Date().toISOString(),
        }),
      );
  };
  var loadDb = function () {
    initDb();
    return JSON.parse(fs.readFileSync(config.dbPath, "utf-8"));
  };
  var saveDb = function (data) {
    return fs.writeFileSync(config.dbPath, JSON.stringify(data, null, 2));
  };
  // Розумна відправка логів (якщо гілки немає - шле в загальний чат)
  var logTo = function (threadId, message) {
    return __awaiter(_this, void 0, void 0, function () {
      var e_1;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 2, , 6]);
            return [
              4 /*yield*/,
              bot.api.sendMessage(config.adminChatId, message, {
                message_thread_id: threadId,
                parse_mode: "HTML",
                //disable_web_page_preview: true,
              }),
            ];
          case 1:
            _b.sent();
            return [3 /*break*/, 6];
          case 2:
            e_1 = _b.sent();
            if (
              !((_a = e_1.description) === null || _a === void 0
                ? void 0
                : _a.includes("message thread not found"))
            )
              return [3 /*break*/, 4];
            // Якщо гілки немає, відправляємо просто в групу адмінів
            return [
              4 /*yield*/,
              bot.api
                .sendMessage(
                  config.adminChatId,
                  "\u26A0\uFE0F <i>(\u0413\u0456\u043B\u043A\u0443 \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E, \u043D\u0430\u0434\u0441\u0438\u043B\u0430\u044E \u0441\u044E\u0434\u0438)</i>\n\n".concat(
                    message,
                  ),
                  { parse_mode: "HTML" },
                )
                .catch(function () {}),
            ];
          case 3:
            // Якщо гілки немає, відправляємо просто в групу адмінів
            _b.sent();
            return [3 /*break*/, 5];
          case 4:
            console.error(
              "[".concat(
                config.name,
                "] \u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043B\u043E\u0433\u0443\u0432\u0430\u043D\u043D\u044F:",
              ),
              e_1.message,
            );
            _b.label = 5;
          case 5:
            return [3 /*break*/, 6];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  var getKeyboard = function () {
    return new grammy_1.InlineKeyboard()
      .url("Відгуки 📝", "https://t.me/infomurumi/7")
      .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
      .row()
      .url("Як це працює? 🗺", "https://t.me/murumishop/106")
      .url("Канал з посилками 📦", "https://t.me/deliverymurumi")
      .row()
      .url("Наш Чатик", "https://t.me/infomurumi");
  };
  initDb();
  // 1. Контроль додавань
  bot.on("message", function (ctx, next) {
    return __awaiter(_this, void 0, void 0, function () {
      var e_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (
              !(
                !config.allowedResources.includes(ctx.chat.id) &&
                ctx.chat.id !== config.adminChatId
              )
            )
              return [3 /*break*/, 6];
            return [
              4 /*yield*/,
              logTo(
                config.threads.logs,
                "\u26A0\uFE0F <b>\u0421\u043F\u0440\u043E\u0431\u0430 \u0434\u043E\u0434\u0430\u0432\u0430\u043D\u043D\u044F!</b>\n\u0427\u0430\u0442: <code>".concat(
                  ctx.chat.id,
                  "</code>\n\u0414\u0456\u044F: <b>\u041B\u0456\u0432\u0430\u044E...</b>",
                ),
              ),
            ];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            _a.trys.push([2, 4, , 5]);
            return [4 /*yield*/, ctx.leaveChat()];
          case 3:
            _a.sent();
            return [3 /*break*/, 5];
          case 4:
            e_2 = _a.sent();
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/];
          case 6:
            return [4 /*yield*/, next()];
          case 7:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  // 2. VIP сердечка
  bot.on("message", function (ctx, next) {
    return __awaiter(_this, void 0, void 0, function () {
      var e_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!(ctx.from && config.vipUsers.includes(ctx.from.id)))
              return [3 /*break*/, 4];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, ctx.react("💘")];
          case 2:
            _a.sent();
            return [3 /*break*/, 4];
          case 3:
            e_3 = _a.sent();
            return [3 /*break*/, 4];
          case 4:
            return [4 /*yield*/, next()];
          case 5:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  // 3. Команда Мур
  bot.hears(/^[Мм]ур[!?.]*$/i, function (ctx) {
    return __awaiter(_this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              ctx.reply("Мяу 🐾", {
                reply_parameters: { message_id: ctx.msg.message_id },
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  // 4. Команда /postREP
  bot.command("postREP", function (ctx) {
    return __awaiter(_this, void 0, void 0, function () {
      var userId, args, chatId, messageId, e_4;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId || !config.admins.includes(userId))
              return [2 /*return*/];
            args = ctx.match.split(" ");
            if (!(args.length !== 2)) return [3 /*break*/, 2];
            return [
              4 /*yield*/,
              ctx.reply(
                "❌ Формат: <code>/postREP -100xxxxxx message_id</code>",
                {
                  parse_mode: "HTML",
                  reply_parameters: { message_id: ctx.msg.message_id },
                },
              ),
            ];
          case 1:
            _b.sent();
            return [2 /*return*/];
          case 2:
            chatId = Number(args[0]);
            messageId = Number(args[1]);
            if (!(isNaN(chatId) || isNaN(messageId))) return [3 /*break*/, 4];
            return [
              4 /*yield*/,
              ctx.reply("❌ ID чату та ID повідомлення мають бути числами!", {
                reply_parameters: { message_id: ctx.msg.message_id },
              }),
            ];
          case 3:
            _b.sent();
            return [2 /*return*/];
          case 4:
            _b.trys.push([4, 7, , 9]);
            return [
              4 /*yield*/,
              ctx.api.sendMessage(chatId, formatPremiumEmoji(config.postText), {
                reply_parameters: { message_id: messageId },
                reply_markup: getKeyboard(),
                parse_mode: "HTML",
              }),
            ];
          case 5:
            _b.sent();
            return [
              4 /*yield*/,
              ctx.reply(
                "\u2705 \u041A\u043D\u043E\u043F\u043A\u0438 \u0434\u043E\u0434\u0430\u043D\u043E!",
                {
                  reply_parameters: { message_id: ctx.msg.message_id },
                },
              ),
            ];
          case 6:
            _b.sent();
            return [3 /*break*/, 9];
          case 7:
            e_4 = _b.sent();
            return [
              4 /*yield*/,
              ctx.reply("❌ Помилка API. Перевір ID та права бота.", {
                reply_parameters: { message_id: ctx.msg.message_id },
              }),
            ];
          case 8:
            _b.sent();
            return [3 /*break*/, 9];
          case 9:
            return [2 /*return*/];
        }
      });
    });
  });
  // 5. Обробка постів з альбомами (канал + чат)
  var sendPostMarkup = function (ctx) {
    return __awaiter(_this, void 0, void 0, function () {
      var mgId, e_5;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mgId = ctx.msg.media_group_id;
            if (mgId) {
              if (processedMediaGroups.has(mgId)) return [2 /*return*/];
              processedMediaGroups.add(mgId);
              setTimeout(function () {
                return processedMediaGroups.delete(mgId);
              }, 60000);
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [
              4 /*yield*/,
              ctx.reply(formatPremiumEmoji(config.postText), {
                reply_parameters: ctx.msg.message_id
                  ? { message_id: ctx.msg.message_id }
                  : undefined,
                reply_markup: getKeyboard(),
                parse_mode: "HTML",
              }),
            ];
          case 2:
            _a.sent();
            return [3 /*break*/, 4];
          case 3:
            e_5 = _a.sent();
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  bot.on("channel_post", function (ctx) {
    return __awaiter(_this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!config.allowedResources.includes(ctx.chat.id))
              return [3 /*break*/, 2];
            return [4 /*yield*/, sendPostMarkup(ctx)];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            return [2 /*return*/];
        }
      });
    });
  });
  bot.on("message", function (ctx, next) {
    return __awaiter(_this, void 0, void 0, function () {
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (
              !(
                ((_a = ctx.msg.sender_chat) === null || _a === void 0
                  ? void 0
                  : _a.type) === "channel" &&
                config.allowedResources.includes(ctx.msg.sender_chat.id)
              )
            )
              return [3 /*break*/, 2];
            return [4 /*yield*/, sendPostMarkup(ctx)];
          case 1:
            _b.sent();
            return [2 /*return*/];
          case 2:
            return [4 /*yield*/, next()];
          case 3:
            _b.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  // 6. Кліки
  bot.on("callback_query:data", function (ctx) {
    return __awaiter(_this, void 0, void 0, function () {
      var db, key;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            db = loadDb();
            key = ctx.callbackQuery.data;
            db.clicks[key] = (db.clicks[key] || 0) + 1;
            saveDb(db);
            return [4 /*yield*/, ctx.answerCallbackQuery("Мур! ✅")];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  // 7. Мовний патруль
  bot.on("message:text", function (ctx) {
    return __awaiter(_this, void 0, void 0, function () {
      var userId, db, cleanChatId, e_6;
      var _a, _b;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            if (
              ((_a = ctx.from) === null || _a === void 0
                ? void 0
                : _a.is_bot) ||
              ctx.chat.id === config.adminChatId
            )
              return [2 /*return*/];
            if (!hasRussian(ctx.msg.text)) return [3 /*break*/, 6];
            userId = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id;
            if (!userId) return [2 /*return*/];
            db = loadDb();
            db.warnings[userId] = (db.warnings[userId] || 0) + 1;
            saveDb(db);
            if (!(db.warnings[userId] >= 3)) return [3 /*break*/, 2];
            cleanChatId = ctx.chat.id.toString().replace("-100", "");
            return [
              4 /*yield*/,
              logTo(
                config.threads.logs,
                "\uD83D\uDEA8 **\u041F\u041E\u0420\u0423\u0428\u0415\u041D\u041D\u042F \u041C\u041E\u0412\u041D\u0418\u0425 \u041F\u0420\u0410\u0412\u0418\u041B**\n\n\uD83D\uDC64 **\u041A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447:** "
                  .concat(ctx.from.first_name, "\n\uD83C\uDD94 **ID:** <code>")
                  .concat(
                    userId,
                    '</code>\n\uD83D\uDD17 <a href="https://t.me/c/',
                  )
                  .concat(cleanChatId, "/")
                  .concat(
                    ctx.msg.message_id,
                    '">\u041F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F</a>',
                  ),
              ),
            ];
          case 1:
            _c.sent();
            return [3 /*break*/, 6];
          case 2:
            _c.trys.push([2, 4, , 6]);
            return [
              4 /*yield*/,
              ctx.reply(
                "\u0410\u0439-\u0430\u0439-\u0430\u0439, "
                  .concat(
                    ctx.from.first_name,
                    ", \u0432 \u0446\u044C\u043E\u043C\u0443 \u0447\u0430\u0442\u0456 \u043D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0441\u043F\u0456\u043B\u043A\u0443\u0432\u0430\u0442\u0438\u0441\u044C \u0440\u043E\u0441\u0456\u0439\u0441\u044C\u043A\u043E\u044E. \u0423\u0441\u043D\u0435 \u043F\u043E\u043F\u0435\u0440\u0435\u0434\u0436\u0435\u043D\u043D\u044F! (",
                  )
                  .concat(db.warnings[userId], "/3)"),
                { reply_parameters: { message_id: ctx.msg.message_id } },
              ),
            ];
          case 3:
            _c.sent();
            return [3 /*break*/, 6];
          case 4:
            e_6 = _c.sent();
            return [
              4 /*yield*/,
              ctx.reply(
                "\u0410\u0439-\u0430\u0439-\u0430\u0439, "
                  .concat(
                    ctx.from.first_name,
                    ", \u0432 \u0446\u044C\u043E\u043C\u0443 \u0447\u0430\u0442\u0456 \u043D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0441\u043F\u0456\u043B\u043A\u0443\u0432\u0430\u0442\u0438\u0441\u044C \u0440\u043E\u0441\u0456\u0439\u0441\u044C\u043A\u043E\u044E. \u0423\u0441\u043D\u0435 \u043F\u043E\u043F\u0435\u0440\u0435\u0434\u0436\u0435\u043D\u043D\u044F! (",
                  )
                  .concat(db.warnings[userId], "/3)"),
              ),
            ];
          case 5:
            _c.sent();
            return [3 /*break*/, 6];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  });
  // 8. ЗВІТИ (Кожні 24 години: Кліки + Хостинг)
  setInterval(function () {
    return __awaiter(_this, void 0, void 0, function () {
      var db, now, lastReset, report, _i, _a, _b, btn, count, sys;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            db = loadDb();
            now = new Date();
            lastReset = new Date(db.lastReset);
            if (!(now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000))
              return [3 /*break*/, 3];
            report =
              "\uD83D\uDCC8 <b>\u0414\u041E\u0411\u041E\u0412\u0418\u0419 \u0417\u0412\u0406\u0422 \u041F\u041E \u041A\u041B\u0406\u041A\u0410\u0425 [".concat(
                config.name,
                "]</b>\n\n",
              );
            if (Object.keys(db.clicks).length === 0)
              report += "Сьогодні ніхто нікуди не тицяв 😿\n";
            else {
              for (
                _i = 0, _a = Object.entries(db.clicks);
                _i < _a.length;
                _i++
              ) {
                ((_b = _a[_i]), (btn = _b[0]), (count = _b[1]));
                report += "\uD83D\uDD39 "
                  .concat(btn, ": ")
                  .concat(count, " \u0440\u0430\u0437\u0456\u0432\n");
              }
            }
            return [4 /*yield*/, logTo(config.threads.clicks, report)];
          case 1:
            _c.sent();
            sys = getSystemInfo();
            return [
              4 /*yield*/,
              logTo(
                config.threads.hosting,
                "\uD83D\uDDA5 <b>\u0429\u043E\u0434\u0435\u043D\u043D\u0438\u0439 \u0437\u0432\u0456\u0442 \u0445\u043E\u0441\u0442\u0438\u043D\u0433\u0443 ["
                  .concat(config.name, "]</b>\n\n<b>RAM:</b> ")
                  .concat(sys.ram, "\n<b>SSD:</b> ")
                  .concat(sys.ssd),
              ),
            ];
          case 2:
            _c.sent();
            // Скидання
            db.clicks = {};
            db.lastReset = now.toISOString();
            saveDb(db);
            _c.label = 3;
          case 3:
            return [2 /*return*/];
        }
      });
    });
  }, 60000); // Перевіряємо час кожну хвилину
  bot.catch(function (err) {
    var e = err.error;
    if (e instanceof grammy_1.GrammyError) {
      console.error(
        "[".concat(
          config.name,
          "] \u041F\u043E\u043C\u0438\u043B\u043A\u0430 Telegram:",
        ),
        e.description,
      );
    } else {
      console.error(
        "[".concat(
          config.name,
          "] \u041D\u0435\u0432\u0456\u0434\u043E\u043C\u0430 \u043F\u043E\u043C\u0438\u043B\u043A\u0430:",
        ),
        e,
      );
    }
  });
  // 9. СТАРТ
  bot.start({
    onStart: function (info) {
      return __awaiter(_this, void 0, void 0, function () {
        var sys, db, dbCount;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              console.log(
                "".concat(
                  config.name,
                  " \u0443\u0441\u043F\u0456\u0448\u043D\u043E \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u0438\u0439! \uD83D\uDE80",
                ),
              );
              sys = getSystemInfo();
              db = loadDb();
              dbCount =
                Object.keys(db.clicks).length + Object.keys(db.warnings).length;
              return [
                4 /*yield*/,
                logTo(
                  config.threads.uptime,
                  "\uD83D\uDFE2 <b>\u041B\u043E\u0433\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0443 (Uptime)</b>\n\n\uD83D\uDE80 \u0411\u043E\u0442 <b>"
                    .concat(config.name, "</b> (@")
                    .concat(
                      info.username,
                      ") \u0443\u0441\u043F\u0456\u0448\u043D\u043E \u043F\u0456\u0434\u043D\u044F\u0432\u0441\u044F!",
                    ),
                ),
              ];
            case 1:
              _a.sent();
              return [
                4 /*yield*/,
                logTo(
                  config.threads.hosting,
                  "\uD83D\uDDA5 <b>\u0425\u043E\u0441\u0442\u0438\u043D\u0433: \u041D\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043F\u0440\u0438 \u0441\u0442\u0430\u0440\u0442\u0456 ["
                    .concat(config.name, "]</b>\n\n<b>RAM:</b> ")
                    .concat(sys.ram, "\n<b>SSD:</b> ")
                    .concat(sys.ssd),
                ),
              ];
            case 2:
              _a.sent();
              return [
                4 /*yield*/,
                logTo(
                  config.threads.db,
                  "\uD83D\uDDC4 <b>\u0411\u0430\u0437\u0438 \u0434\u0430\u043D\u0438\u0445 ["
                    .concat(
                      config.name,
                      "]:</b>\n\u041A\u0456\u043B\u044C\u043A\u0456\u0441\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u0456\u0432: ",
                    )
                    .concat(
                      dbCount,
                      "\n\u0428\u0432\u0438\u0434\u043A\u0456\u0441\u0442\u044C \u0432\u0456\u0434\u0433\u0443\u043A\u0443 API: OK \u26A1\uFE0F",
                    ),
                ),
              ];
            case 3:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    },
  });
}
// ==========================================
// 4. ЗАПУСК БОТІВ
// ==========================================
startBot(MUR_CONFIG);
// startBot(SHIGI_CONFIG); // Розкоментуй, коли заповниш дані Шігі
