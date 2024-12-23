const { deductDateRange } = require("../datetimeMatching");

const getIntValidator = (msg) => (number) => {
    if (number !== undefined && isNaN(number = parseInt(number)))
        return {success: false, msg}

    return {success: true, data: number}
}

const partSizeValidator = getIntValidator("You have to mention a number for partsize");

const dateToDateRangeValidator = (strDate,params) => {
    if (strDate === "all")
        strDate = undefined;

    const dateRange = strDate ? deductDateRange(strDate) : [null,null];

    if (strDate && dateRange === null)
        return {success: false, msg: `"${strDate}" is not a valid date`};

    return {success: true, params: {...params, dateRange}}
}

module.exports = {partSizeValidator, dateToDateRangeValidator}