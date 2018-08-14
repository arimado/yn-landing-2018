const express = require("express");
const path = require("path");

const server = express();

const webpack = require("webpack");
const config = require("../../config/webpack.dev.js");
const compiler = webpack(config); // webpack returns a compiler with the config object

const webpackDevMiddleware = require("webpack-dev-middleware")(
    compiler,
    config.devServer
)

const webpackHotMiddleware = require("webpack-hot-middleware")(compiler);


server.use(webpackDevMiddleware);
server.use(webpackHotMiddleware); // order matters

const staticMiddleware = express.static("dist");

server.use(staticMiddleware);

server.listen(8080, () => {
    console.log("server is listening")
});