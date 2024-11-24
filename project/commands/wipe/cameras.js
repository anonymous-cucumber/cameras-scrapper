const {question} = require("../../libs/ui");
const Camera = require("../../models/Camera");

function getArgs() {
    return {}
}

function example() {
    return  "\nnode console.js wipe cameras"
}

async function execute(params) {
    const res = await question("Are you SURE do you want wipe all cameras (Y/n) ?  ");
    if (!["yes","y","oui","o"].some(str => str === res.toLowerCase())) {
        console.log("no")
        return;
    }
    await Camera.deleteMany({});
    console.log("All cameras deleted successfully");
}

module.exports = {getArgs, example, execute}