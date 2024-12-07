const fs = require("fs/promises");
const {logsPath} = require("../paths");

const maxFileSize = 50*1024*1024; // 50MB
const thresholdWritting = 2;
let notWrittenLines = [];

const latestFilePath = logsPath+"latest.log";

async function writeLogs(msg) {
    const dateStr = new Date().toISOString();
    const logMsg = `${dateStr} ${msg}`;

    console.log(logMsg)

    notWrittenLines.push(logMsg);
    if (notWrittenLines.length < thresholdWritting)
        return;

    await fs.appendFile(latestFilePath, notWrittenLines.join("\n")+"\n");
    notWrittenLines = [];

    const {size} = await fs.stat(latestFilePath)
    if (size < maxFileSize)
        return


    const oldFilePath = logsPath+"old_"+dateStr+".log";
    await fs.rename(latestFilePath, oldFilePath);
    return fs.writeFile(latestFilePath, "");
}

module.exports = {writeLogs};