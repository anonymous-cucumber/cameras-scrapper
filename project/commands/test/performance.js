const fs = require("fs/promises")
const {fileExists} = require("../../libs/fsUtils");
const {question} = require("../../libs/ui");
const replaceAll = require("../../libs/replaceAll");
const {testsPerformanceCSVsPath, performanceTestsBase} = require("../../paths");


function getArgs() {
    return {
        testPath: async (testPath) => {
            if (testPath === undefined)
                return {success: false, msg: "You have to mention a path for your tests"};

            const testsFilePath = `${performanceTestsBase}${testPath}/tests.js`;
            if (await fileExists(testsFilePath))
                return {success: true, params: {testPath, tests: require(testsFilePath)}}

            return {success: false, msg: `Test path '${testPath}' not found`};
        },
        config: async (configName, params) => {
            const {testPath} = params;
            if (configName === undefined) return {success: true};

            const configFilePath = `${performanceTestsBase}${testPath}/${configName}.json`
            if (!(await fileExists(configFilePath)))
                return {success: false, msg: `Config file ${configName}.json not found in path ${testPath}`}

            const content = await fs.readFile(configFilePath).then(chk => chk.toString());

            try {
                return {success: true, params: {...params, configName, config: JSON.parse(content)}}
            } catch(e) {
                return {success: false, msg: "Fail when trying to compile config file"}
            }
        },
        name: (name) => ({success: true, data: name})
    }
}

function example() {
    return (
        "\nnode console.js test performance <testsPath> [config]"+
        "\nnode console.js test performance api/camerasSearching local"+
        "\nnode console.js test performance hello_world"
    );
}

async function execute({testPath, tests, config, configName, name}) {
    if (name) {
        console.log(`Test name : ${name}`)
    }
    if (config) {
        console.log("config :")
        console.log(Object.keys(config).map(k => `\t${k}: ${config[k]}`).join("\n"))
        console.log("")
    }
    console.log("You are about to execute and store results of following tests:")
    console.log(Object.keys(tests).map(testName => "\t"+testName).join("\n"))

    const res = await question("Do you want to execute them (Y/n) ?  ");
    if (!["yes","y","oui","o"].some(str => str === res.toLowerCase())) {
        console.log("no")
        return;
    }

    console.log("")
    
    const header = "Test name;Response";
    const lines = [];

    const testsKeys = Object.keys(tests);
    for (let i=0;i<testsKeys.length;i++) {
        const testKey = testsKeys[i];
        console.log(`Executing ${testKey} (${i+1}/${testsKeys.length}) ...`)
        const response = await tests[testKey](config ?? {});
        lines.push(`${testKey};${response}`);
    }
    
    const csv = header+"\n"+lines.join("\n");

    const formattedTestPath = replaceAll(testPath, "/", "-");
    const csvPath = `${testsPerformanceCSVsPath}${formattedTestPath}${configName ? "_"+configName : ""}${name ? "_"+name : ""}_${new Date().toISOString()}.csv`

    await fs.writeFile(csvPath, csv);

    console.log(`\n${csvPath} saved`)
}

module.exports = {getArgs,example,execute}