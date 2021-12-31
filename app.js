var createError = require("http-errors");
var express = require("express");

var app = express();

const http = require("http");
const server = http.createServer(app);
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const io  = require("socket.io")(3000, {
  cors: {
    origin: ["http://localhost:8080"],
  },
});

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

var numberOfConnections = 1;

var scores = [];

io.on("connection", (socket) => {
  
  io.emit('playernumchanged', numberOfConnections);

  socket.on("successful connection", () => {
    numberOfConnections++;
  })

  socket.on("disconnect", () => {
    numberOfConnections--;
  });

  socket.on('my message', (msg) => {
    io.emit('my broadcast', `server message: ${msg}`);
  });

  socket.on("new score", (player, score) => {
    var playerScore = scores.find(x => x.Name == player);
    if(player == null || score == null) return;
    if(playerScore == undefined) {

      var newScore = {
        Name: player, 
        Score: score
      };

      scores.push(newScore);
    }
    else {
      playerScore.Score = score;
    }

    io.emit('scores changed', scores);
  })

}); 

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
