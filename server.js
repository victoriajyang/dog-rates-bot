/* Setting things up. */
var path = require('path'),
    express = require('express'),
    app = express(),   
    Twit = require('twit'),
    tracery = require('tracery-grammar'),
    config = {
    /* Be sure to update the .env file with your API keys. See how to get them: https://botwiki.org/tutorials/how-to-create-a-twitter-app */      
      twitter: {
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
      }
    },
    T = new Twit(config.twitter);
var request = require('request');
var fs = require('fs');
app.use(express.static('public'));

/* You can use uptimerobot.com or a similar site to hit your /BOT_ENDPOINT to wake up your app and make your Twitter bot tweet. */

app.all("/" + process.env.BOT_ENDPOINT, function (req, res) {
  /* The example below tweets out "Hello world!". */
  T.post('statuses/update', { status: 'hello world 👋' }, function(err, data, response) {
    if (err){
      console.log('error!', err);
      res.sendStatus(500);
    }
    else{
      res.sendStatus(200);
    }
  });
});

const download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

//const generateStatus = () => {
  // Generate a new tweet using our grammar
//  return ${grammar.flatten("#origin#")}; // make sure an "origin" entry is in your grammar.json file
//}

const getArtwork = function() {
  var rawGrammar = require('./grammar.json');
  var grammar = tracery.createGrammar(rawGrammar);
  grammar.addModifiers(tracery.baseEngModifiers); 
  const status = grammar.flatten('#origin#');
  //T.post('statuses/update', { status}, function(err, data, response) {
  //  console.log(data);
  //});
  request.get({url: 'https://random.dog/woof.json',},
  function (e, r, body) {
    let json = JSON.parse(body);
    const url = json.url; 
    download(url, 'img.jpg', function(){ // img.jpg is what we want it saved as
        console.log('img saved to img.jpg');
        tweet(status);
    });
  });
}

const tweet = function(status) {
 const b64content = fs.readFileSync('./img.jpg', { encoding: 'base64' }); // this is the image we downloaded from ARTSY
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
      // now we can assign alt text to the media, for use by screen readers and
      // other text-based presentations and interpreters
      var mediaIdStr = data.media_id_string;
      var altText = `I love dogs!`; 
      var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

      T.post('media/metadata/create', meta_params, function (err, data, response) {
          if (!err) {
              // now we can reference the media and post a tweet (media will attach to the tweet)
              var params = { status, media_ids: [mediaIdStr] };

              T.post('statuses/update', params, function (err, data, response) {
                  console.log(data);
              });
          }
      })
  });
}

getArtwork();

var listener = app.listen(process.env.PORT, function () {
  console.log('Your bot is running on port ' + listener.address().port);
});