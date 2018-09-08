
var fs = require("fs")
var path = require("path")
fs.readdir(path.join(`${__dirname}/temp/rawImageSplit`), function (err, files) {
    console.log('files: ', files)
});