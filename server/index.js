//packages
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import http from "http";
import path from "path";
import url from "url";
import exphbs from "express-handlebars";
import _ from "lodash";
import mongoose from "mongoose";
import passport from "passport";
import nLog from "noogger";
import io from "socket.io";
import adapter from "socket.io-redis";
import cors from "cors";

// routes
import routes from "./routes/index.js";
import commonRoutes from "./routes/common.js";
import profileRoutes from "./routes/profile.js";

// controllers
import socketHandling from "./controllers/signalling.js";
import videoAudioSocketHandling from "./controllers/videoAudioStreamSignalling.js";
import partyChatSocketHandling from "./controllers/partyChatSignalling.js";

// others
import { socketAauthentication } from "./config/socket-authentication.js";

dotenv.config();
const socketIo = io();

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//logger configurations
var nlogParams = {
    consoleOutput: true,
    consoleOutputLevel: "DEBUG",
    dateTimeFormat: "DD-MM-YYYY HH:mm:ss",
    fileNameDateFormat: "YYYY-MM-DD",
    fileNamePrefix: "watchyaari-",
    outputPath: "logs/",
};
nLog.init(nlogParams);

var app = express();
var server = http.createServer(app);

const redisAdapter = adapter({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    // password: process.env.REDIS_PASS || 'password',
});

mongoose.Promise = global.Promise;
const option = {
    socketTimeoutMS: 0,
    connectTimeoutMS: 0,
};

// DB connection
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);
mongoose.connect(process.env.DB_CONNECTION, option, function (err) {
    if (err) console.log(err);
    else console.log("connected..");
});

//Use CORS
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    next();
});

// Use body-parser to get POST requests for API use
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        parameterLimit: 50000,
        extended: false,
    })
);
app.use(
    bodyParser.json({
        limit: "50mb",
    })
);

// passport startegy
import passportConfig from "./config/passport.js";
passportConfig(passport);

// Initialize passport for use
app.use(passport.initialize());
app.use(passport.session());

app.use("/", routes);
app.use("/common", commonRoutes);
app.use("/profile", profileRoutes);

// View Engine
app.set("views", path.join(__dirname, "views"));
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "layout",
    })
);
app.set("view engine", "handlebars");

app.use(express.static(path.join(__dirname, "files")));
app.use("/files", express.static(path.join(__dirname, "files")));

// Set Port
app.set("port", process.env.PORT || 80);

// var io = socketsocketIo.listen(server);
socketIo.attach(server);
socketIo.adapter(redisAdapter);

const partySync = socketIo.of("/partySync");
const videoAudioStream = socketIo.of("/videoAudioStream");
const partyChat = socketIo.of("/partyChat");

socketAauthentication(partySync);
socketAauthentication(videoAudioStream, "videostreamusers");
// sockAuthentication.socketAauthentication(partyChat, "chatusers");

/* socketIo.on('connection', function (socket) {
    console.log("DEFAULT CONNECTION....", )
}); */

partySync.on("connection", function (socket) {
    // console.log("#partySync::", JSON.stringify(socket.handshake.query))
    socketHandling(socket, io);
});

videoAudioStream.on("connection", function (socket) {
    // console.log("#videoAudioStream::", JSON.stringify(socket.handshake.query))
    videoAudioSocketHandling(socket, io);
});

partyChat.on("connection", function (socket) {
    // console.log("#partyChat::", JSON.stringify(socket.handshake.query))
    partyChatSocketHandling(socket, io);
});

server.listen(app.get("port"), function () {
    console.log("Server started on port " + app.get("port"));
    nLog.info("Server started on port " + app.get("port"));
});
