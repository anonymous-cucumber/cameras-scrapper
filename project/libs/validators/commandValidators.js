const getIntValidator = (msg) => async (number) => {
    if (number !== undefined && isNaN(number = parseInt(number)))
        return {success: false, msg}

    return {success: true, data: number}
}

const partSizeValidator = getIntValidator("You have to mention a number for partsize");

module.exports = {partSizeValidator}