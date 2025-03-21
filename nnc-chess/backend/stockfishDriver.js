const DEBUG = false;

async function stockfishDriver() {
    const childProcess = require('node:child_process');
    const stockfish = childProcess.spawn('node', ['./node_modules/stockfish/src/stockfish-nnue-16.js']);

    stockfish.on("error", function (err)
    {
        throw err;
    });

    stockfish.on("exit", function (code) {
        if (code) {
            error("Exited with code: " + code);
            throw new Error("Exited with code: " + code);
        }
    });


    function write(str, callback) {
        if (DEBUG) console.warn("Send to SF: " + str);
        stockfish.stdin.write(str + "\n", (err) => {
            if (DEBUG) console.log("Write successful");
            if (/^position/.exec(str)) {
                if (DEBUG) console.log("position method, skipping listener");
                callback();
            } else if (/^go\s+/.exec(str)) {
                if (DEBUG) console.log("go method invoked, skipping lines");
                stockfish.stdout.on("data", (data) => {
                    if (DEBUG) console.log("DATA STREAM (go method):", data.toString());
                    let match = /bestmove\s+(\w{4})/.exec(data);
                    if (match) {
                        // Grab the current position evaluation
                        const bestMove = match[1];
                        stockfish.stdout.removeAllListeners('data');
                        callback(bestMove);
                    }
                });
            } else if (/^eval/.exec(str)) {
                if (DEBUG) console.log("eval method invoked, skipping lines");
                stockfish.stdout.on("data", (data) => {
                    if (DEBUG) console.log("DATA STREAM (eval method): ", data.toString());
                    let match = /(Final evaluation:?\s+)([+\-\d.]+|none)/.exec(data);
                    match = match ? match.slice(1) : null;
                    if (match) {
                        if (DEBUG) console.log("MATCH eval result: ", match);
                        // Grab the current position evaluation
                        const posEval = match[1];
                        stockfish.stdout.removeAllListeners('data');
                        callback(posEval);
                    }
                });
            } else {
                stockfish.stdout.on("data", (data) => {
                    if (DEBUG) console.log("DATA:", data);
                    if (typeof data !== "string") {
                        data = data.toString();
                    }
                    stockfish.stdout.removeAllListeners('data');
                    callback(data);
                });
            }
        });
    }
      

    return new Promise((resolve) =>
        stockfish.stdout.on("data", (data) => {
            stockfish.stdout.removeAllListeners('data');
            if (DEBUG) console.log("Cleared INIT:", data.toString());
            resolve({write});
        })
    ); 
}
module.exports = stockfishDriver;


