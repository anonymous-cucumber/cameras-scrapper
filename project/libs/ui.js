const readline = require('node:readline');

function question(str) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(str, res => {
            rl.close();
            resolve(res)
        });
    })
}

module.exports = {question};