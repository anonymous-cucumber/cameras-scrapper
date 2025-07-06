const http = require("http");
const https = require("https");
const RequestTimeout = require("./exceptions/RequestTimeout");

const protos = {https,http};

function request(fullUrl, params = {}) {
    return new Promise((resolve, reject) => {
        const [proto, url] = fullUrl.split("://");

        const [host, port] = url.split("/")[0].split(":")
        const path = "/"+url.split("/").slice(1).join("/")


        const protoLib = protos[proto ?? "http"];

        const controller = new AbortController();
        const signal = controller.signal;

        params = { 
            ...params,
            signal,
            timeout: params.timeout ?? 5000,
            host, 
            port, 
            path 
        };
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

        req.on("timeout", () => {
            controller.abort();
            reject(new RequestTimeout(params.timeout));
        })

        req.end();
    });
}

module.exports = request;