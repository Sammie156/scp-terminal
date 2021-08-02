import { ipcRenderer } from "electron";
import axios from "axios";
import cheerio from 'cheerio';

let error = false;
let helpflag = false;

/**
 * Processes the options in a command
 * @param args the command args
 * @param flags the command flags. can be null
 * @param count number of args required
 */
const checkOptions = (args: any[], flags: string | any[] | null, count: number) => {
    error = false;
    if (args) {
        // valid options will start with `-`
        const options = args.map(i => {
            if (i.startsWith("-")) {
                return i;
            }
        })
        // make sure there arent too many options being supplied
        if (options.length > count) {
            error = true;
            termwindow.append(span("status-fail", "Error: Command has too many args.\n"));
            return;
        }
        // the help flag is available to any command
        if (options[0] === "-help") {
            helpflag = true;
            return;
        }
        else {
            if (flags === null && options.length > 0 && !options.includes(undefined)) {
                error = true;
                termwindow.append(span("status-fail", `'${options[0]}' does not match the supported flags.\n`));
                return;
            }
            if (flags) {
                for (const f of flags) {
                    for (const p of options) {
                        if (f === p) {
                            error = false;
                            return;
                        }
                        else {
                            error = true;
                        }
                    }
                }
                if (error) {
                    termwindow.append(span("status-fail", `'${options[0]}' does not match the supported flags2.\n`));
                }
            }
        }
    }
}

/**
 * Prints the usage of a given command
 * @param command the command to get help for
 */
const getHelp = (command: string) => {
    commands_.forEach(cmd => {
        if (command === cmd.name) {
            termwindow.append(h5(cmd.name));
            termwindow.append(`<hr>`);
            // print the usage with options if it has any
            if (cmd.args) {
                termwindow.append(`${cmd.description}\nUsage:\n ${cmd.usage}\nOptions\n `);
                const descs: string[] = [...cmd.argsd]; // gotta copy the array because ref types are dumb
                for (const arg of cmd.args) {
                    termwindow.append(`${arg} : `);
                    for (const d of descs) {
                        termwindow.append(`${d}\n `);
                        descs.shift();
                        break;
                    }
                }
            }
            else {
                termwindow.append(`${cmd.description}\nUsage: \n ${cmd.usage}\n`);
            }
            termwindow.append(`<hr>`);
        }
    })
    helpflag = false;
}

const manual = (args: any[]) => {
    checkOptions(args, null, 1);
    if (helpflag) {
        getHelp("manual");
        return;
    }
    if (!error) {
        showMainMenu();
    }
}

const search = async (args: any[]) => {
    const options = ["-s", "-e", "-k", "-t", "-j"];
    checkOptions(args, options, 2);
    if (helpflag) {
        getHelp("search");
        return;
    }
    if (!error) {
        if (args[0] === "-s") {
            const url = `http://scp-wiki.wikidot.com/system:page-tags/tag/safe`;
            const a = axios.create();
            await a.get(url).then(
                (html: { data: any }) => {
                    const data = html.data;
                    const content = cheerio.load(data);
                    const x = content("#tagged-pages-list");
                    termwindow.append(h3("Safe SCPs"));
                    termwindow.append(`<hr>`);
                    termwindow.append(pageData(x.html()?.trim()));
                }
            ).catch(
                (error) => {
                    console.log(error.response.data);
                }
            )
        }
        else if (args[0] === "-e") {
            const url = `http://scp-wiki.wikidot.com/system:page-tags/tag/euclid`;
            const a = axios.create();
            await a.get(url).then(
                (html: { data: any }) => {
                    const data = html.data;
                    const content = cheerio.load(data);
                    const x = content("#tagged-pages-list");
                    termwindow.append(h3("Euclid SCPs"));
                    termwindow.append(`<hr>`);
                    termwindow.append(pageData(x.html()?.trim()));
                }
            )
        }
        else if (args[0] === "-k") {
            const url = `http://scp-wiki.wikidot.com/system:page-tags/tag/keter`;
            const a = axios.create();
            await a.get(url).then(
                (html: { data: any }) => {
                    const data = html.data;
                    const content = cheerio.load(data);
                    termwindow.append(h3("Keter SCPs"));
                    termwindow.append(`<hr>`);
                    const x = content("#tagged-pages-list");
                    termwindow.append(pageData(x.html()?.trim()));
                }
            )
        }
        else if (args[0] === "-t") {
            const url = `http://scp-wiki.wikidot.com/system:page-tags/tag/thaumiel`;
            const a = axios.create();
            await a.get(url).then(
                (html: { data: any }) => {
                    const data = html.data;
                    const content = cheerio.load(data);
                    const x = content("#tagged-pages-list");
                    termwindow.append(h3("Thaumiel SCPs"));
                    termwindow.append(`<hr>`);
                    termwindow.append(pageData(x.html()?.trim()));
                }
            )
        }
        else if (args[0] === "-j") {
            const url = `http://scp-wiki.wikidot.com/joke-scps/noredirect/true`;
            const a = axios.create();
            await a.get(url).then(
                (html: { data: any }) => {
                    const data = html.data;
                    const content = cheerio.load(data);
                    const x = content(".content-panel");
                    termwindow.append(h3("Joke SCPs"));
                    termwindow.append(`<hr>`);
                    termwindow.append(pageData(x.html()?.trim()));
                }
            )
        }
        else {
            termwindow.append("Full list of SCPs not available\n");
        }
    }
}
const exit = (args: any[]) => {
    checkOptions(args, null, 1);
    if (helpflag) {
        getHelp("exit");
        return;
    }
    if (!error) {
        ipcRenderer.send("exit");
    }
}
const help = (args: any[]) => {
    checkOptions(args, null, 1);
    if (helpflag) {
        getHelp("help");
        return;
    }
    if (!error) {
        termwindow.append(h3("Commands"));
        termwindow.append("<hr>");
        commands_.forEach(cmd => {
            termwindow.append(`\n${cmd.description}\nUsage:\n ${cmd.usage}\n\n`);
        });
        termwindow.append("<hr>");
    }
}
const echo = async (args: any[]) => {
    checkOptions(args, null, 2);
    if (helpflag) {
        getHelp("echo");
        return;
    }
    if (!error) {
        await sleep(5000);
        termwindow.append(`${args}\n`);
    }
}
const access = async (args: any[]) => {
    checkOptions(args, null, 1);
    if (helpflag) {
        getHelp("access");
        return;
    }
    if (!error) {
        if (!args[0].startsWith("scp-")) {
            if (args[0] === "random") {
                const url = `http://scp-wiki.wikidot.com/random:random-scp`;
                const a = axios.create();
                await a.get(url).then(
                    (html: { data: any; }) => {
                        const data = html.data;
                        const content = cheerio.load(data);
                        const x = content("#page-content");
                        const rating = content(".page-rate-widget-box");
                        const footer = content(".footer-wikiwalk-nav");
                        const license = content(".licensebox");
                        const mobileexit = content(".mobile-exit");
                        const iframe = content("iframe");
                        const info = content(".info-container");
                        rating.remove();
                        footer.remove();
                        license.remove();
                        mobileexit.remove();
                        iframe.remove();
                        info.remove();
                        termwindow.append(pageData(x.html()?.trim()));
                    }
                ).catch(console.error);
                return;
            }
            termwindow.append("no\n"); 
            return;
        }
        const url = `http://scp-wiki.wikidot.com/${args[0]}`;
        const a = axios.create();
        await a.get(url).then(
            (html: { data: any; }) => {
                const data = html.data;
                const content = cheerio.load(data);
                const x = content("#page-content");
                const rating = content(".page-rate-widget-box");
                const footer = content(".footer-wikiwalk-nav");
                const license = content(".licensebox");
                const mobileexit = content(".mobile-exit");
                const iframe = content("iframe");
                const info = content(".info-container");
                rating.remove();
                footer.remove();
                license.remove();
                mobileexit.remove();
                iframe.remove();
                info.remove();
                termwindow.append(pageData(x.html()?.trim()));
            }
        ).catch(console.error);
    }
}
const security = (args: any[]) => {
    checkOptions(args, null, 1);
    if (helpflag) {
        getHelp("security");
        return;
    }
    if (!error) {
        termwindow.append("security level not available\n");
    }
}
const clear = (args: any[]) => {
    checkOptions(args, null, 1);
    if (!error) {
        termwindow_.textContent = "";
    }
}

const test = async (args: any[]) => {
    const op = ["-t"];
    checkOptions(args, op, 1);
    if (helpflag) {
        getHelp("test");
        return;
    }
    if (!error) {
        termwindow.append("test");
    }
}

const commands_ = [
    {
        "name": "search",
        "usage": "search [flags]",
        "args": ["-s", "-e", "-k", "-t", "-j"],
        "argsd": ["safe scps", "euclid scps", "keter scps", "thaumiel scps", "joke scps"],
        "description": "search - Lists all scps or filtered scps set by flags",
        "function": search
    },
    {
        "name": "exit",
        "description": "exit - exits the app",
        "usage": "exit",
        "function": exit
    },
    {
        "name": "help",
        "description": "help - brings up help command",
        "usage": "help || [command] -help",
        "function": help
    },
    {
        "name": "echo",
        "description": "echo - A test command",
        "usage": "echo [message]",
        "function": echo
    },
    {
        "name": "manual",
        "description": "manual - Displays the help menu",
        "usage": "manual",
        "function": manual
    },
    {
        "name": "access",
        "description": "access - Access a scp file",
        "usage": "access [scp] [flags]",
        "args": ["-rnd"],
        "argsd": ["Displays a random scp file"],
        "function": access
    },
    {
        "name": "security",
        "description": "security - Displays security level of a scp file",
        "usage": "security [scp] [options]",
        "function": security
    },
    {
        "name": "test",
        "description": "test - test command",
        "usage": "test [whatever shit your testing idk]",
        "function": test
    },
    {
        "name": "clear",
        "description": "clear - Clears the terminal",
        "usage": "clear",
        "function": clear
    }
]
exports.cmdlist = commands_;
