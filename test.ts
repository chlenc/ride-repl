import repl from 'repl';
import { repl as compiler } from "@waves/ride-js";

const diamond = `\x1b[34mRIDE \x1b[0m\uD83D\uDD37 \x1b[90m>\x1b[94m>\x1b[0m\x1b[34m>\x1b[0m `;
repl.start({
    prompt: diamond,
    eval: function (input, context, filename, cb) {
        const res = compiler(input);
        cb("error" in res ? res.error : null, "result" in res ? res.result : null);
    }
});
