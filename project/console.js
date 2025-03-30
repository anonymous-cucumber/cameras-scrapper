const {fileExists} = require("./libs/fsUtils");

async function getCommand(args = process.argv.slice(2), base = `${__dirname}/commands/`, depth = 1) {
    let path;

    if (await fileExists(path = `${base}/index.js`))
        return {...require(path), depth: depth-1};

    if (args.length === 0)
        throw new Error("Please mention a command");

    const command = args.shift();

    if (await fileExists(path = `${base}/${command}.js`))
        return {...require(path), depth};
    
    if (!(await fileExists(path = `${base}/${command}`)))
        throw new Error("Command '"+command+"' does not exist");

    return getCommand(args, base+command+"/", depth+1)
}

async function computeArgs(args, depth, example, params = {}) {
    const nbAlreadyComputedArgs = Object.keys(params).length;

    const arrayArgs = Object.keys(args);
    for (let i=0;i<arrayArgs.length;i++) {
        const [key,check] = [arrayArgs[i], args[arrayArgs[i]]];
        const value = process.argv[2 + depth + nbAlreadyComputedArgs + i];
        const {success, msg, data, params: newParams} = await check(value,params);
        if (!success) {
            throw new Error(msg+"\n\nExample => "+example(params))
        }
        if (newParams) {
            params = newParams;
        } else {
            params[key] = data??value;
        }
    }

    return params;
}

(async () => {
    process.dontLog = true;

    const {getArgs, getOtherConditionnalArgs, postParams, example, execute, depth} = await getCommand();

    let params = await computeArgs(getArgs(), depth, example)

    if (params.help) {
        console.log(example(params));
        process.exit();
    }
    
    if (getOtherConditionnalArgs) {
        const otherConditionnalArgs = getOtherConditionnalArgs(params);
        params = await computeArgs(otherConditionnalArgs, depth, example, params);
    }

    if (postParams) {
        const {success, msg, params: newParams} = await postParams(params);
        if (!success) {
            throw new Error(msg+"\n\nExample => "+example(params))
        }
        if (newParams) {
            params = newParams;
        }
    }

    await execute(params);

    process.exit();
})();