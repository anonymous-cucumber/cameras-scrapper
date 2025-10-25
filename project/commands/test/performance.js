const {fileExists} = require("../../libs/fsUtils");
const {question} = require("../../libs/ui");
const fs = require("fs/promises");

const testsBase = process.mainModule.path+"/tests/performance/"

function getArgs() {
    return {
        testPath: async (testPath) => {
            if (await fileExists(testsBase+testPath))
                return {success: true, params: {allTests: require(testsBase+testPath)}}
            if (await fileExists(testsBase+testPath+".js"))
                return {success: true, params: {allTests: require(testsBase+testPath+".js")}}

            return {success: false, msg: `Test path '${testPath}' not found`};
        },
        tests: async (testNames, {allTests}) => {
            if (testNames === undefined) return {success: true, params: {tests: allTests}};

            const tests = {};
            for (const testName of testNames.split(",")) {
                if (allTests[testName] == undefined)
                    return {success: false, msg: `Given test name ${testName} does not exist`};
                tests[testName] = allTests[testName];
            }
            return {success: true, params: {tests}};
        },
    }
}

function example() {
    return (
        "\nnode console.js test performance api/camerasSearching"+
        "\nnode console.js test performance api/camerasSearching getDefaultFranceBbox,getParisCenterBbox"
    );
}

async function execute({tests}) {
    console.log("You are about to execute and store results of following tests:")
    console.log(Object.keys(tests).map(testName => "\t"+testName).join("\n"))

    const res = await question("Do you want to execute them (Y/n) ?  ");
    if (!["yes","y","oui","o"].some(str => str === res.toLowerCase())) {
        console.log("no")
        return;
    }
    console.log("Command does not yet exists, good bye")
}

module.exports = {getArgs,example,execute}