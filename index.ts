import charmInit from 'charm';
import { repl, version } from "@waves/ride-js";

const diamond = `\x1b[34mRIDE \x1b[0m\uD83D\uDD37 \x1b[90m>\x1b[94m>\x1b[0m\x1b[34m>\x1b[0m `;
const diamondLength = 13;
const welcomeMessage = `\x1b[1m${'Welcome to RIDE repl\nCompiler version ' + version}\x1b[0m\n\n`;
const keyMap = {
    enter: '[13]',
    delete: '[127]',
    up: '[27,91,65]',
    down: '[27,91,66]',
    right: '[27,91,67]',
    left: '[27,91,68]'
};


let history: string[] = [];
let line: string = '';
let currentHistoryRow: number | null = null;

const getPos: () => Promise<{ x: number, y: number }> =
    async () => new Promise(resolve => charm.position((x, y) => resolve({x, y})));

const rewrite = (s: string, x: number) => charm.erase("line").left(x).write(diamond + s);


const charm = charmInit(process);
charm.pipe(process.stdin);
charm.reset();
charm.write(`${welcomeMessage}${diamond}`);
charm.on('^C', process.exit);

charm.on("data", async (chunk: Buffer) => {
    try {
        const code = chunk.toJSON().data.map(key => +key);
        if ((chunk).length === 1 || Object.values(keyMap).includes(JSON.stringify(code))) {
            const {x, y} = await getPos();
            switch (JSON.stringify(code)) {
                case keyMap.up: {
                    charm.down(1);
                    if (history.length && currentHistoryRow !== 0) {
                        currentHistoryRow = currentHistoryRow == null ? history.length - 1 : currentHistoryRow - 1;
                        rewrite(history[currentHistoryRow], x);
                        line = history[currentHistoryRow];
                    }
                    break;
                }
                case keyMap.down: {
                    if (process.stdout.rows !== y) charm.up(1);
                    if (history.length && currentHistoryRow != null) {
                        currentHistoryRow = (currentHistoryRow === history.length - 1)
                            ? null
                            : currentHistoryRow + 1;
                        if (currentHistoryRow == null) rewrite('', x);
                        else {
                            rewrite(history[currentHistoryRow], x);
                            line = history[currentHistoryRow];
                        }
                    } else if (currentHistoryRow == null) rewrite('', x);
                    break;
                }
                case keyMap.right:
                case keyMap.left: {
                    if (x < diamondLength) charm.right(1);
                    if (x > (diamondLength + line.length)) charm.left(1);
                    break;
                }
                case keyMap.enter:
                    if (line === '') charm.down(1).write(diamond);
                    else run(line);
                    line = '';
                    break;
                case keyMap.delete: {
                    if (line.length > 0) {
                        let s = x - diamondLength - 2;
                        if (s !== -1) {
                            let split = line.split('');
                            split.splice(s, 1);
                            line = split.join('');
                        }
                        charm.erase("line").left(x).write(diamond + line, () => {
                            const leftOffset = line.length - s;
                            charm.left(leftOffset)
                        })
                    } else rewrite('', x);
                    break;
                }
                default:
                    let s = x - diamondLength - 1;
                    let split = line.split('');
                    split.splice(s, 0, chunk.toString());
                    line = split.join('');
                    rewrite(line, x);
                    break;
            }
        }


    } catch (e) {

    }

});


function run(world: string) {
    history.push(world);
    currentHistoryRow = null;
    const res = repl(world);
    process.stdout.write('\n');
    charm
        .foreground('error' in res ? 'red' : 'green')
        .write('error' in res ? res.error : res.result);
    process.stdout.write('\n');
    charm.write(diamond);
}

