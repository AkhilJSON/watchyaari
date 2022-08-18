//packages
require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var path = require("path");
var exphbs = require("express-handlebars");
var _ = require("lodash");
var mongoose = require("mongoose");
var passport = require("passport");
var nLog = require("noogger");
const io = require("socket.io")();
const adapter = require("socket.io-redis");
const cors = require("cors");

// routes
var routes = require("./routes/index");
var commonRoutes = require("./routes/common");
var profileRoutes = require("./routes/profile");

// controllers
var signalling = require("./controllers/signalling");
var videoAudioStreamSignalling = require("./controllers/videoAudioStreamSignalling");
var partyChatSignalling = require("./controllers/partyChatSignalling");

// others
var sockAuthentication = require("./config/socket-authentication");

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
require("./config/passport")(passport);

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

// var io = socketIO.listen(server);
io.attach(server);
io.adapter(redisAdapter);

const partySync = io.of("/partySync");
const videoAudioStream = io.of("/videoAudioStream");
const partyChat = io.of("/partyChat");

sockAuthentication.socketAauthentication(partySync);
sockAuthentication.socketAauthentication(videoAudioStream, "videostreamusers");
// sockAuthentication.socketAauthentication(partyChat, "chatusers");

/* io.on('connection', function (socket) {
    console.log("DEFAULT CONNECTION....", )
}); */

partySync.on("connection", function (socket) {
    // console.log("#partySync::", JSON.stringify(socket.handshake.query))
    signalling.socketHandling(socket, io);
});

videoAudioStream.on("connection", function (socket) {
    // console.log("#videoAudioStream::", JSON.stringify(socket.handshake.query))
    videoAudioStreamSignalling.videoAudioSocketHandling(socket, io);
});

partyChat.on("connection", function (socket) {
    // console.log("#partyChat::", JSON.stringify(socket.handshake.query))
    partyChatSignalling.partyChatSocketHandling(socket, io);
});

server.listen(app.get("port"), function () {
    console.log("Server started on port " + app.get("port"));
    nLog.info("Server started on port " + app.get("port"));
});
