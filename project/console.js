const {fileExists} = require("./libs/fsUtils");

(async() => {
    process.dontLog = true;

    const [,,action] = process.argv;

    if (action === undefined) {
        throw new Error("Please mention a command");
    }

    if (!(await fileExists(__dirname+"/commands/"+action+".js"))) {
        throw new Error("Command '"+action+"' does not exist");
    }

    const {getArgs, example, execute} = require(__dirname+"/commands/"+action+".js");
    
    const args = getArgs();

    const arrayArgs = Object.entries(args);

    let params = {};

    for (let i=0;i<arrayArgs.length;i++) {
        const [key,check] = arrayArgs[i];
        const {success, msg, data, params: newParams} = await check(process.argv[3+i],params);
        if (!success) {
            throw new Error(msg+"\n\nExample => "+example())
        }
        if (newParams) {
            params = newParams;
        } else {
            params[key] = data??process.argv[3+i];
        }
    }

    await execute(params);

    process.exit();
})();