/// <reference types="node" />
import build from "pino-abstract-transport";
declare enum pinoLevelType {
    "TRACE" = "TRACE",
    "DEBUG" = "DEBUG",
    "INFO" = "INFO",
    "WARN" = "WARN",
    "ERROR" = "ERROR",
    "FATAL" = "FATAL",
    "OTHERS" = "OTHERS"
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
interface slackConfig extends commonConfig {
}
interface othersConfig extends commonConfig {
}
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
/**
 *
 * @param [options] settings
 * @returns transport to be used with pino
 */
export declare const createTransport: (options: options) => import("stream").Transform & build.OnUnknown;
export {};
