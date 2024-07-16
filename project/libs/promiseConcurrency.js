async function promiseConcurrency(promises, concurrency, betweenCallback = null) {
    lists = promises.reduce((acc,promise) => 
        acc[acc.length-1]?.length < concurrency ?
            acc.slice(0,-1).concat([(acc[acc.length-1]??[]).concat([promise])]) :
            acc.concat([[promise]])
    , [])

    let res = [];
    for (let i=0;i<lists.length;i++) {
        const promises = lists[i];
        res = res.concat(await Promise.all(promises.map(promise => promise())));
        if (betweenCallback !== null) betweenCallback(i+1,lists.length);
    }
    return res;
}

module.exports = promiseConcurrency;