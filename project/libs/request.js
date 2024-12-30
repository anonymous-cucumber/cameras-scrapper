const http = require("http");
const https = require("https");

function request(fullUrl, params) {
    return new Promise(resolve => {
        const protos = {https,http};

        const [proto, url] = fullUrl.split("://");

        const [host, port] = url.split("/")[0].split(":")
        const path = "/"+url.split("/").slice(1).join("/")


        const protoLib = protos[proto ?? "http"];

        params = { ...params, host, port, path };
        const req = protoLib.request(params, res => {
            let data = [];
            res.on("data", chunk => data.push(chunk));
            res.on("end", () => {
                const resData = Buffer.concat(
                    data,
                    data.reduce((acc, item) => acc + item.length, 0)
                ).toString();

                const result = (params.getHeaders || params.getCode) ? {data: resData} : resData;
                if (params.getHeaders)
                    result.headers = res.headers;
                if (params.getCode)
                    result.code = res.statusCode

                resolve(result);
            });
        });
        if (params.body)
            req.write(params.body);
        req.end();
    });
}

module.exports = request;