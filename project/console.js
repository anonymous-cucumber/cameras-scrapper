const {fileExists} = require("./libs/fsUtils");

(async() => {
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

    const params = {};

    for (let i=0;i<arrayArgs.length;i++) {
        const [key,check] = arrayArgs[i];
        const {success, msg, data} = await check(process.argv[3+i]);
        if (!success) {
            throw new Error(msg+"\nExample => "+example())
        }
        params[key] = data??process.argv[3+i];
    }

    await execute(params);

    process.exit();
})();