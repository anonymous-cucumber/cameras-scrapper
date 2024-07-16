const http = require("http");
const https = require("https");

function request(url,params) {
    return new Promise(resolve => {
        const protos = {https,http};
        const proto = protos[url.split("://")[0] ?? "http"];
        params = {
            ...params,
            host: url.split("://")[1].split("/")[0],
            path: "/"+url.split("://")[1].split("/").slice(1).join("/")
        };
        const req = proto.request(params, res => {
            let data = [];
            res.on("data", chunk => data.push(chunk));
            res.on("end", () => {
                const resData = Buffer.concat(
                    data,
                    data.reduce((acc, item) => acc + item.length, 0)
                ).toString();
                resolve(params.getHeaders ? {headers: res.headers, data: resData} : resData);
            });
        });
        if (params.body)
            req.write(params.body);
        req.end();
    });
}

module.exports = request;