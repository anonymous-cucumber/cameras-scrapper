function replaceAll(str,a,b) {
    while (str !== (str = str.replace(a,b))) {}
    return str;
}

module.exports = replaceAll;