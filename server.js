// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Requiring Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

//Define port
var port = process.env.PORT || 3000;

// Initialize Express
var app = express();

app.use(logger("dev"));
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
  })
);
app.set("view engine", "handlebars");

// Database configuration with mongoose
var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);
//mongoose.connect("mongodb://localhost/mongoscraper");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
//GET requests to render Handlebars pages
app.get("/", function(req, res) {
  Article.find({ saved: false }, function(error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("home", hbsObject);
  });
});

app.get("/saved", function(req, res) {
  Article.find({ saved: true })
    .populate("notes")
    .exec(function(error, articles) {
      var hbsObject = {
        article: articles
      };
      res.render("saved", hbsObject);
    });
});

// A GET request to scrape the website
app.get("/scrape", function(req, res) {
  request("https://www.nationalenquirer.com/", function(error, response, html) {
    var $ = cheerio.load(html);

    $("article").each(function(i, element) {
      var result = {};

      // Add the title and summary of every link

      result.title = $(this)
        .find(".promo-title")
        .text();
      result.summary = $(this)
        .find(".subtitle")
        .text();

      result.link = $(this)
        .find("a")
        .attr("href");

      var entry = new Article(result);

      // Save that entry to the db
      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });
    });
    // Display Scrape Complete message
    res.send("Scrape Complete");
  });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab the Articles array
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  });
});

// Grab an article Id
app.get("/articles/:id", function(req, res) {
  Article.findOne({ _id: req.params.id })
    // populate notes
    .populate("note")

    .exec(function(error, doc) {
      if (error) {
        console.log(error);
      } else {
        res.json(doc);
      }
    });
});

// Store an article
app.post("/articles/save/:id", function(req, res) {
  Article.findOneAndUpdate({ _id: req.params.id }, { saved: true }).exec(
    function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        res.send(doc);
      }
    }
  );
});

// Remove an article
app.post("/articles/remove/:id", function(req, res) {
  Article.findOneAndUpdate(
    { _id: req.params.id },
    { saved: false, notes: [] }
  ).exec(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.send(doc);
    }
  });
});

// Create a new note
app.post("/notes/save/:id", function(req, res) {
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body);
  // save the new note the db
  newNote.save(function(error, note) {
    if (error) {
      console.log(error);
    } else {
      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { notes: note } }
      ).exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.send(note);
        }
      });
    }
  });
});

// Remove a note
app.delete("/notes/remove/:note_id/:article_id", function(req, res) {
  Note.findOneAndRemove({ _id: req.params.note_id }, function(err) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      Article.findOneAndUpdate(
        { _id: req.params.article_id },
        { $pull: { notes: req.params.note_id } }
      ).exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.send("Note Removed");
        }
      });
    }
  });
});

// Listen on port
app.listen(port, function() {
  console.log("App running on port " + port);
});
