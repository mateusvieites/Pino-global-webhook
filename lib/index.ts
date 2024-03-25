import build from "pino-abstract-transport";
import https from "https";
import axios, { AxiosRequestConfig } from "axios";

enum pinoLevelType {
  "TRACE" = "TRACE",
  "DEBUG" = "DEBUG",
  "INFO" = "INFO",
  "WARN" = "WARN",
  "ERROR" = "ERROR",
  "FATAL" = "FATAL",
  "OTHERS" = "OTHERS",
}

interface IColors {
  color?: {
    [pinoLevelType.TRACE]: number;
    [pinoLevelType.DEBUG]: number;
    [pinoLevelType.INFO]: number;
    [pinoLevelType.WARN]: number;
    [pinoLevelType.ERROR]: number;
    [pinoLevelType.FATAL]: number;
    [pinoLevelType.OTHERS]: number;
  };
}
interface logOutput {
  level?: number;
  time?: string;
  pid?: number;
  hostname?: string;
  msg?: string;
  type?: pinoLevelType;
  raw?: string;
  [key: string]: any;
}

interface commonConfig {
  /**
   * Use same agent
   */
  sameAgent?: boolean;
  /**
   * Remove the target tag
   */
  removeTag?: ("level" | "time" | "pid" | "hostname" | "msg" | "type")[];
  /**
   *  Remove all tags with includes the string
   */
  withWordRemoveTag?: string[];
  /**
   * Add custom tags to the log and you can use "<tag>" inside a string to references a tag
   */
  customTags?: Record<string, number | string>[];
}

interface discordConfig extends commonConfig, IColors {
  webhookType?: 1 | 2 | 3;
}
interface slackConfig extends commonConfig {}

interface othersConfig extends commonConfig {}
export interface options {
  webhooks: string[];

  /**
   *  Discord configurations
   */
  discord?: discordConfig;
  /**
   *  Slack configurations
   */
  slack?: slackConfig;
  /**
   *  Others configurations
   */
  others?: othersConfig;
}

const pinoLevelEntry = {
  "10": pinoLevelType.TRACE,
  "20": pinoLevelType.DEBUG,
  "30": pinoLevelType.INFO,
  "40": pinoLevelType.WARN,
  "50": pinoLevelType.ERROR,
  "60": pinoLevelType.FATAL,
  default: pinoLevelType.OTHERS,
};

const sendWebhook = async (
  axiosConfig: AxiosRequestConfig<any>
): Promise<void> => {
  return axios(axiosConfig)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Erro ao fazer requisição para asdad: ${error.message}`);
    });
};

const adjustWithCommonConfigs = (
  log: logOutput,
  properties: discordConfig | slackConfig | othersConfig
): logOutput => {
  if (!properties["customTags"]) properties["customTags"] = [];
  if (!properties["removeTag"]) properties["removeTag"] = [];
  if (!properties["withWordRemoveTag"]) properties["withWordRemoveTag"] = [];
  //@ts-ignore
  const type = pinoLevelEntry[log.level!.toString()] || pinoLevelEntry.default;
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

interface DiscordEmbedFields {
  name: string;
  value: number | string;
}

const sendSlackLog = async (
  webhooks: options["webhooks"],
  log: logOutput,
  config: slackConfig = { sameAgent: false }
) => {
  const agent =
    config.sameAgent || config.sameAgent === undefined
      ? https.Agent
      : undefined;

  log = await adjustWithCommonConfigs(log, config);
  const Promises: Promise<void>[] = [];
  webhooks.forEach((webhook) => {
    const payload = {
      text: log,
    };
    Promises.push(
      sendWebhook({
        url: webhook,
        httpAgent: agent,
        method: "post",
        data: payload,
      })
    );
  });
  await Promise.all(Promises);
  config.sameAgent || config.sameAgent === undefined ? https.Agent : undefined;

  log = await adjustWithCommonConfigs(log, config);
};

const sendOthersLog = async (
  webhooks: options["webhooks"],
  log: logOutput,
  config: othersConfig = { sameAgent: false }
) => {
  const agent =
    config.sameAgent || config.sameAgent === undefined
      ? https.Agent
      : undefined;

  log = await adjustWithCommonConfigs(log, config);
  const Promises: Promise<void>[] = [];
  webhooks.forEach((webhook) => {
    Promises.push(
      sendWebhook({
        url: webhook,
        httpAgent: agent,
        method: "post",
        data: log,
      })
    );
  });
  await Promise.all(Promises);
};

const sendDiscordLog = async (
  webhooks: options["webhooks"],
  log: logOutput,
  config: discordConfig = {
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
  }
) => {
  const agent =
    config.sameAgent || config.sameAgent === undefined
      ? https.Agent
      : undefined;

  log = await adjustWithCommonConfigs(log, config);
  const Promises: Promise<void>[] = [];
  const color = config.color![log.type!] || config.color!["OTHERS"];
  const fields: DiscordEmbedFields[] = [];
  for (const key in log) {
    fields.push({
      name: key,
      value: log[key],
    });
  }
  const title = log.type || "Log";
  const payload = {
    type: config.webhookType!,
    embeds: [
      {
        title: `[${title}]`,
        color: color,
        fields: fields,
      },
    ],
  };

  webhooks.forEach((webhook) => {
    Promises.push(
      sendWebhook({
        url: webhook,
        httpAgent: agent,
        method: "post",
        data: payload,
      })
    );
  });
  await Promise.all(Promises);
};
/**
 *
 * @param [options] settings
 * @returns transport to be used with pino
 */
export const createTransport = (options: options) => {
  return build(async (source) => {
    const urlOthers: string[] = [];
    const urlDiscord: string[] = [];
    const urlSlack: string[] = [];
    const promises: Promise<void>[] = [];
    options.webhooks.forEach((url) => {
      if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url)) {
        if (url.includes("discord")) {
          urlDiscord.push(url);
        } else if (url.includes("slack")) {
          urlSlack.push(url);
        } else {
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
  });
};
