class RequestTimeout extends Error {
    constructor(timeout = 5000) {
      super(`Error, timeout of ${timeout} ms has been exceeded`);
    }
}
  
module.exports = RequestTimeout;