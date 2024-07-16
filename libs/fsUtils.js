const fs = require("fs/promises")

const fileExists = path => fs.access(path, fs.constants.F_OK).then(() => true).catch(() => false);

module.exports = {fileExists}