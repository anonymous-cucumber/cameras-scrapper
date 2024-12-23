const {fileExists} = require("./libs/fsUtils");

async function getCommand(args = process.argv.slice(2), base = `${__dirname}/commands/`, depth = 1) {
    if (args.length === 0)
        throw new Error("Please mention a command");

    const command = args.shift();

    let path;

    if (await fileExists(path = `${base}/${command}.js`))
        return {...require(path), depth};
    
    if (!(await fileExists(path = `${base}/${command}`)))
        throw new Error("Command '"+command+"' does not exist");

    return getCommand(args, base+command+"/", depth+1)
}

(async () => {
    process.dontLog = true;

    const {getArgs, postArgs, example, execute, depth} = await getCommand();
    
    const args = getArgs();

    const arrayArgs = Object.entries(args);

    let params = {};

    for (let i=0;i<arrayArgs.length;i++) {
        const [key,check] = arrayArgs[i];
        const value = process.argv[i+2+depth];
        const {success, msg, data, params: newParams} = await check(value,params);
        if (!success) {
            throw new Error(msg+"\n\nExample => "+example())
        }
        if (newParams) {
            params = newParams;
        } else {
            params[key] = data??value;
        }
    }
    if (postArgs) {
        const {success, msg, params: newParams} = await postArgs(params);
        if (!success) {
            throw new Error(msg+"\n\nExample => "+example())
        }
        if (newParams) {
            params = newParams;
        }
    }

    await execute(params);

    process.exit();
})();