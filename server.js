// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Body Parser
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// Make Static Directory
app.use(express.static(process.cwd() + "/public"));

// Configure Mongoose
var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Connection Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose Connection Success!");
});

// Handlebar setup
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Importing routes
var router = express.Router();
require("./config/routes")(router);
app.use(router);

var port = process.env.PORT || 3000;

// listener
app.listen(port, function() {
  console.log("app running on port " + port);
});
