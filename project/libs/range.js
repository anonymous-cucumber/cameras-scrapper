function range(a, b) {
    if (a === undefined) throw "Mention at least one value"

    const [start, end] = b !== undefined ? [a, b] : [1, a];

    const list = [];
    for (let i=start;i<=end;i++) {
        list.push(i);
    }
    return list;
}

module.exports = range;