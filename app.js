const config = require("config");
const error = require('./middleware/error')
let createError = require("http-errors");

let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let mongoose = require("mongoose");

let indexRouter = require("./routes/index");
let usersRouter = require("./routes/users");
let authRouter = require("./routes/auth");

let app = express();

console.log(process.env["omowo_jwtPrivateKey"]);

if (!config.get("jwtPrivateKey")) {
  console.error("FATAL ERROR: jwtPrivateKey is not defined.");
  process.exit(1);
}

mongoose
  .connect("mongodb://localhost/omowo")
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB..."));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/auth", authRouter);

require('./startup/prod')(app);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


// error handler
app.use(error);

module.exports = app;
