// *******************************************
// DATABASE SETUP ****************************
// *******************************************
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test'
var quotes
var topquote

// *******************************************
// EXPRESS SETUP  ****************************
// *******************************************

var express = require('express');
var app = express();
var router = express.Router();    
var path = require('path');
var bodyParser = require('body-parser');

app.use('/demo', express.static(path.join(__dirname, '..', 'static')));
app.use(bodyParser.json());
app.set('json spaces', 2);

// *******************************************
// FRONT PAGE APPLICATION AND GREETING *******
// *******************************************

// index with helpful message
app.get('/', function(request, reply) {
  reply.send('Hello world from express');
});

// *******************************************
// REST API ROUTES ***************************
// *******************************************

app.use('/api', router);

// QUOTE LIST
router.route('/quotes')
  .get(function(request, reply)  {
      quotes.find().sort({index:-1}).limit(10).toArray((err, results) => {
	      reply.send(results)
      })
  })
  .post(function(request, reply) {
    // There has to be at *least* a content field
    if(!request.body.hasOwnProperty('content')) {
      return reply.status(400).send('Error 400: Post syntax incorrect.');
    }
    topquote += 1;

    // Create the object from the POST body
    let quoteBody = {
      "content":request.body.content,
      "index":topquote
    } 

    if (request.body.hasOwnProperty('author')) {
      quoteBody["author"] = request.body.author
    }

    // Save the new quote
    quotes.save(quoteBody, function(err, result) {
      return reply.status(201).send({"index":topquote});
    })
  })

// RANDOM QUOTE FROM THE DATABASE
router.route('/quotes/random')
  .get(function(request, reply) {
    var random = Math.floor(Math.random()*topquote)
    console.log(random)
    quotes.findOne({"index":random}, (err, results) => {
       reply.send(results)
    })
  })

// SINGLE QUOTE
router.route('/quotes/:index')
  .get(function(request, reply) {
    index = parseInt(request.params.index)
    quotes.findOne({"index":index}, (err, results) => {
       reply.send(results)
    })
  })
  .put(function(request, reply) {
    var newQuote = {};
    var query = {'index':parseInt(request.params.index)}
    if(!request.body.hasOwnProperty('content')) {
      return reply.status(400).send('Error 400: Put syntax incorrect.');
    } else {
      newQuote["content"] = request.body.content;
      newQuote["index"] = parseInt(request.params.index);
    }

    if (request.body.hasOwnProperty('author')) {
      newQuote["author"] = request.body.author;
    }

    quotes.findOneAndUpdate(query, newQuote, {upsert:true}, function(err, results) {
      if (err) return reply.send(500, { error: err });
      return reply.status(201).send({"index":request.params.index});
    })
  })
  .delete(function(request, reply) {
    let query = {'index':parseInt(request.params.index)}
    quotes.findOneAndDelete(query, (err, results) => {
      reply.status(204).send();
    })
  })


// ********************************************
// SERVERS ************************************
// ********************************************

MongoClient.connect(url, function(err, database)  {
    if (err) return console.log(err)
    console.log("Connected successfully to database server");
    quotes = database.collection('quotes')

    // Find the largest index for creating new quotes
    quotes.find().sort({"index": -1}).limit(1).toArray((err, quote) => {
      topquote = quote[0]["index"]
    })

    app.listen(8080, "0.0.0.0", function() {
      console.log('Express is listening to http://0.0.0.0:8080');
    })
})


