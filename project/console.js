const {fileExists} = require("./libs/fsUtils");

async function getCommand(args = process.argv.slice(2), base = `${__dirname}/commands/`, deep = 1) {
    if (args.length === 0)
        throw new Error("Please mention a command");

    const command = args.shift();

    let path;

    if (await fileExists(path = `${base}/${command}.js`))
        return {...require(path), deep};
    
    if (!(await fileExists(path = `${base}/${command}`)))
        throw new Error("Command '"+command+"' does not exist");

    return getCommand(args, base+command+"/", deep+1)
}

(async() => {
    process.dontLog = true;

    const {getArgs, example, execute, deep} = await getCommand();
    
    const args = getArgs();

    const arrayArgs = Object.entries(args);

    let params = {};

    for (let i=0;i<arrayArgs.length;i++) {
        const [key,check] = arrayArgs[i];
        const value = process.argv[i+2+deep];
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

    await execute(params);

    process.exit();
})();