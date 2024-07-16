const dateUnits = [
    ["getFullYear", "setFullYear", "", "([0-9]{4})","1970"],
    [(d) => d.getMonth()+1, (d,n) => d.setMonth(n-1), "-", "([0-9]{2})","01"],
    ["getDate", "setDate", "-", "([0-9]{2})","01"],
    ["getHours", "setHours", "T", "([0-9]{2})","00"],
    ["getMinutes", "setMinutes", ":", "([0-9]{2})","00"],
    ["getSeconds", "setSeconds", ":", "([0-9]{2})","00"],
    [null, null, ".", "([0-9]{3})Z?","000"]
]

function deductDateRange(strDate) {
    let regex = "";
    let inputUnits = null;

    for (const [,,del,reg] of dateUnits) {
        regex += `${del && "\\"+del}${reg}`;
        const match = strDate.match(`^${regex}$`);
        if (match !== null) {
            inputUnits = match.slice(1)
            break;
        }
    }
    if (inputUnits === null)
        return null;

    const date = new Date(dateUnits.reduce((acc,[,,del,,defaultValue],i) =>
        acc+del+(inputUnits[i] ?? defaultValue)
    , ""))
    const dateB = new Date(date.getTime());

    for (let i=dateUnits.length-1;i>=0;i--) {
        const [getter,setter] = dateUnits[i];
        if (getter === null || setter === null)
            continue;
        if (inputUnits[i] === undefined)
            continue;
    
        const getUnit = typeof(getter) === "string" ? (d => d[getter]()) : getter;
        const setUnit = typeof(setter) === "string" ? ((d,n) => d[setter](n)) : setter;
    
        setUnit(dateB, getUnit(dateB)+1);
        return [date,dateB];
    }
    return null;
}

module.exports = {deductDateRange}