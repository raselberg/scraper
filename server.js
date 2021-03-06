var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


app.get("/",function (req, res) {
  
})


app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://old.reddit.com/r/BlackPeopleTwitter/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // console.log("THERESA LOOK", $)
    var title;
    var link;



    $("a.title").each(function (i, element) {
      title = $(this).text();
      link = "https://old.reddit.com" + $(this).attr("href");

      db.Post.create({
        title,
        link
      })
        .then(function (dbShowThread) {
          // View the added result in the console
          console.log(dbShowThread);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
    }

    )
    



    // Now, we grab every h2 within an article tag, and do the following:
    // $("article h2").each(function(i, element) {


    //   // Create a new Article using the `result` object built from scraping
    //   db.Article.create(result)
    //     .then(function(dbArticle) {
    //       // View the added result in the console
    //       console.log(dbArticle);
    //     })
    //     .catch(function(err) {
    //       // If an error occurred, log it
    //       console.log(err);
    //     });
    // });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/getInfo", function (req, res) {
    // Grab every document in the Articles collection
    db.Post.find({})
    .then(function(bptPost) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(bptPost);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Post.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


//this route is not ready for the user to onclick the save btn, this will add "saved:true" to mongo db
// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Post.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Post.findOneAndUpdate({ _id: req.params.id }, { save: true });
    })
    .then(function(Post) {
      // If we were able to successfully update an Post, send it back to the client
      res.json(Post);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//when we show the saved tab, go to this routing "/saved"
//then it will make comm. to mongo db and look for all data with "save:true" 
//and only show articles with save:true
app.get("/saved", function(req, res) {
  // Go into the mongo collection, and find all docs where "read" is false
  db.Post.find({ save: true }, function(error, found) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    else {
      // Otherwise, send the books we found to the browser as a json
      res.json(found);
    }
  });
});


// Connect to the Mongo DB
var CONNECTION_URI = process.env.MONGODB_URI || "mongodb://localhost/BPT";
mongoose.connect(CONNECTION_URI, { useNewUrlParser: true });

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});

