const mongoose = require("mongoose");

let nbRetry = 0;
const nbRetryMax = 20;

let database;

const connect = () => {

    if (nbRetry >= nbRetryMax) {
        console.log("Connexion impossible");
        return;
    } else if (nbRetry > 0) {
        console.log("Re try to connect")
    }

    if (database) return database;

    const url = 'mongodb://' + process.env.MONGO_INITDB_USERNAME + ':' + process.env.MONGO_INITDB_PASSWORD + '@' + process.env.MONGO_HOST + ':27017/' + process.env.MONGO_INITDB_DATABASE;

    mongoose.connect(url);

    mongoose.set('strictQuery', true);

    database = mongoose;

    database.connection.once("open", () => {
        console.log("Connected to database");
    });

    database.connection.on("error", () => {
        console.log("Error connecting to database");
        database = undefined;
        nbRetry += 1;
        setTimeout(connect, 250);
    });

    return database;
};

const disconnect = () => {
    if (!database) return;
    mongoose.disconnect();
    return mongoose;
};

module.exports = {connect, disconnect};