import {Client, MetadataStorage} from '@typeit/discord';
import {Message} from 'discord.js';
import moment = require('moment');

const helpText: Map<any, Map<string, string>> = new Map();

function getHelp(target: any, key: string) {
    const map: Map<string, string> | undefined = helpText.get(target);
    if (!map) {
        return;
    }
    return map.get(key);
}

export function help(text: string) {
    return (target: any, key: string, descriptor: PropertyDescriptor) => {
        let map: Map<string, string> | undefined = helpText.get(target);
        if (!map) {
            map = new Map();
            helpText.set(target, map);
        }
        map.set(key, text);
    };
}

const usedCommands: string[] = [];

export function OnCommand(...commands: string[]) {
    for (const command of commands) {
        if (usedCommands.indexOf(command) >= 0) {
            // tslint:disable-next-line:no-console
            console.trace('Command already in use: ' + command);
        }
        usedCommands.push(command);
    }
    return (target: any, key: string, descriptor: PropertyDescriptor) => {
        function validateArgs(args: string[]): any[] | boolean {
            const map: Map<string, Map<number, any>> | undefined = par.get(target);
            if (!map) {
                return true;
            }
            const indexs: Map<number, any> | undefined = map.get(key);
            if (!indexs) {
                return true;
            }
            const l = Array.from(indexs.keys()).sort().pop();
            if (l === undefined || args.length < l + 1) {
                return false;
            }
            try {
                for (let i = 0; i < args.length; i++) {
                    const types = indexs.get(i);
                    if (types.length > 0) {
                        args[i] = types[0](args[i]);
                    }
                }
            } catch (e) {
                return false;
            }
            return true;
        }

        MetadataStorage.Instance.AddOn({
            class: target.constructor,
            key,
            params: {
                event: 'message',
                once: false,
                method(message: Message, client: Client): void {
                    const args = message.content.split(' ');
                    let cmd = args.shift();
                    if (!cmd) {
                        return;
                    }
                    cmd = cmd.toLocaleLowerCase();
                    if (message.author.bot || cmd[0] !== '.' ||
                        !(commands.includes(cmd.substring(1)))) {
                        return; // exit the function
                    }
                    if (!validateArgs(args)) {
                        const text = getHelp(target, key);
                        if (text) {
                            // noinspection JSIgnoredPromiseFromCall
                            message.channel.send(text);
                        }
                        return;
                    }
                    if (!descriptor.value(...args, message, client)) {
                        // noinspection JSIgnoredPromiseFromCall
                        message.delete({timeout: 500});
                    }
                },
            },
        });
    };
}

const par: Map<any, Map<string, Map<number, any>>> = new Map();

function registerType(type: any):
    (target: any, propertyKey: string, parameterIndex: number) => void {
    return (target: any, propertyKey: string, parameterIndex: number): void => {
        let paramMap: Map<string, Map<number, any[]>> | undefined = par.get(target);
        if (!paramMap) {
            paramMap = new Map();
            par.set(target, paramMap);
        }
        let paramIndexes: Map<number, any[]> | undefined = paramMap.get(propertyKey);
        if (!paramIndexes) {
            paramIndexes = new Map();
            paramMap.set(propertyKey, paramIndexes);
        }
        let types: any[] | undefined = paramIndexes.get(parameterIndex);
        if (!types) {
            types = [];
            paramIndexes.set(parameterIndex, types);
        }
        types.push(type);
    };
}

export function momentType() {
    return registerType((arg: string) => {
        return moment(arg, 'HH:mm');
    });
}

export function stringType() {
    return registerType((arg: string) => {
        return arg;
    });
}
