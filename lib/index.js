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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransport = void 0;
const pino_abstract_transport_1 = __importDefault(require("pino-abstract-transport"));
const https_1 = __importDefault(require("https"));
const axios_1 = __importDefault(require("axios"));
var pinoLevelType;
(function (pinoLevelType) {
    pinoLevelType["TRACE"] = "TRACE";
    pinoLevelType["DEBUG"] = "DEBUG";
    pinoLevelType["INFO"] = "INFO";
    pinoLevelType["WARN"] = "WARN";
    pinoLevelType["ERROR"] = "ERROR";
    pinoLevelType["FATAL"] = "FATAL";
    pinoLevelType["OTHERS"] = "OTHERS";
})(pinoLevelType || (pinoLevelType = {}));
const pinoLevelEntry = {
    "10": pinoLevelType.TRACE,
    "20": pinoLevelType.DEBUG,
    "30": pinoLevelType.INFO,
    "40": pinoLevelType.WARN,
    "50": pinoLevelType.ERROR,
    "60": pinoLevelType.FATAL,
    default: pinoLevelType.OTHERS,
};
const sendWebhook = (axiosConfig) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)(axiosConfig)
        .then((response) => response.data)
        .catch((error) => {
        throw new Error(`Erro ao fazer requisição para asdad: ${error.message}`);
    });
});
const adjustWithCommonConfigs = (log, properties) => {
    if (!properties["customTags"])
        properties["customTags"] = [];
    if (!properties["removeTag"])
        properties["removeTag"] = [];
    if (!properties["withWordRemoveTag"])
        properties["withWordRemoveTag"] = [];
    //@ts-ignore
    const type = pinoLevelEntry[log.level.toString()] || pinoLevelEntry.default;
    log.type = type;
    properties.customTags.forEach((customTag) => {
        for (const key in customTag) {
            log[key] = customTag[key];
        }
    });
    properties.removeTag.forEach((tag) => {
        delete log[tag];
    });
    for (const key in log) {
        properties.withWordRemoveTag.forEach((word) => {
            if (typeof log[key] === "string" && log[key].includes(word)) {
                delete log[key];
            }
        });
    }
    return log;
};
const sendSlackLog = (webhooks_1, log_1, ...args_1) => __awaiter(void 0, [webhooks_1, log_1, ...args_1], void 0, function* (webhooks, log, config = { sameAgent: false }) {
    const agent = config.sameAgent || config.sameAgent === undefined
        ? https_1.default.Agent
        : undefined;
    log = yield adjustWithCommonConfigs(log, config);
    const Promises = [];
    webhooks.forEach((webhook) => {
        const payload = {
            text: log,
        };
        Promises.push(sendWebhook({
            url: webhook,
            httpAgent: agent,
            method: "post",
            data: payload,
        }));
    });
    yield Promise.all(Promises);
    config.sameAgent || config.sameAgent === undefined ? https_1.default.Agent : undefined;
    log = yield adjustWithCommonConfigs(log, config);
});
const sendOthersLog = (webhooks_2, log_2, ...args_2) => __awaiter(void 0, [webhooks_2, log_2, ...args_2], void 0, function* (webhooks, log, config = { sameAgent: false }) {
    const agent = config.sameAgent || config.sameAgent === undefined
        ? https_1.default.Agent
        : undefined;
    log = yield adjustWithCommonConfigs(log, config);
    const Promises = [];
    webhooks.forEach((webhook) => {
        Promises.push(sendWebhook({
            url: webhook,
            httpAgent: agent,
            method: "post",
            data: log,
        }));
    });
    yield Promise.all(Promises);
});
const sendDiscordLog = (webhooks_3, log_3, ...args_3) => __awaiter(void 0, [webhooks_3, log_3, ...args_3], void 0, function* (webhooks, log, config = {
    sameAgent: false,
    webhookType: 1,
    color: {
        TRACE: 0x808080,
        DEBUG: 0x008000,
        INFO: 0x00bfff,
        WARN: 0xffa500,
        ERROR: 0xff4500,
        FATAL: 0xff0000,
        OTHERS: 0x440f3c,
    },
}) {
    const agent = config.sameAgent || config.sameAgent === undefined
        ? https_1.default.Agent
        : undefined;
    log = yield adjustWithCommonConfigs(log, config);
    const Promises = [];
    const color = config.color[log.type] || config.color["OTHERS"];
    const fields = [];
    for (const key in log) {
        fields.push({
            name: key,
            value: log[key],
        });
    }
    const title = log.type || "Log";
    const payload = {
        type: config.webhookType,
        embeds: [
            {
                title: `[${title}]`,
                color: color,
                fields: fields,
            },
        ],
    };
    webhooks.forEach((webhook) => {
        Promises.push(sendWebhook({
            url: webhook,
            httpAgent: agent,
            method: "post",
            data: payload,
        }));
    });
    yield Promise.all(Promises);
});
/**
 *
 * @param [options] settings
 * @returns transport to be used with pino
 */
const createTransport = (options) => {
    return (0, pino_abstract_transport_1.default)((source) => __awaiter(void 0, void 0, void 0, function* () {
        const urlOthers = [];
        const urlDiscord = [];
        const urlSlack = [];
        const promises = [];
        options.webhooks.forEach((url) => {
            if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url)) {
                if (url.includes("discord")) {
                    urlDiscord.push(url);
                }
                else if (url.includes("slack")) {
                    urlSlack.push(url);
                }
                else {
                    urlOthers.push(url);
                }
            }
        });
        source.forEach((log) => {
            if (urlDiscord.length) {
                promises.push(sendDiscordLog(urlDiscord, log, options.discord));
            }
            if (urlSlack.length) {
                promises.push(sendSlackLog(urlSlack, log, options.slack));
            }
            if (urlOthers.length) {
                promises.push(sendOthersLog(urlSlack, log, options.others));
            }
        });
    }));
};
exports.createTransport = createTransport;
