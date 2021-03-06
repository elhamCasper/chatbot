//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  var quickReply = message.quick_reply;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        
        break;
        
      case 'hi':
        sendTextMessage(senderID, "Hellooo there :)");
        break;
        
      case 'Hi':
        sendTextMessage(senderID, "Hellooo there :)");
        break;
        
      case 'menu':
        sendplay(senderID);
        break;

      default:
        //sendTextMessage(senderID, messageText);
        
      defaultanswer(senderID, messageId, messageText);
        break;
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
  if(event.message.quick_reply){
    sendQuickReply(senderID, quickReply, messageId, messageText);
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  // sendTextMessage(senderID, "Postback called");
  switch(payload){
      case'GET_STARTED':
      sendGetStarted(senderID);
      break;
      
      case'start':
      sendstart(senderID);
      break;
      
      case'menu1':
      sendsections(senderID);
      break;
      
      case'section1':
      sendquickreply1(senderID);
      break;
  }
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});


function sendplay(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: " GAMES",
          buttons:[{
              type: "postback",
              title: "Puzzle",
              payload: "puzzle"
          },       {
            type: "postback",
            title: "Know yourself",
            payload: "knowyourself"
          }, {
            type: "postback",
            title: "Find the difference",
            payload: "photodiferent"
          } 
          ]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendGetStarted (recipientId){

  request ({
  url:"https://graph.facebook.com/v2.6/" + recipientId ,
    qs:{
    access_token:process.env.PAGE_ACCESS_TOKEN,
      fields:""
    
    },
    method:"GET",
    
  
  },function (error, response, body){
  if(error){
  console.log("error getting username")
  }else{
  
  var bodyObj = JSON.parse(body)
var name = bodyObj.first_name
  var lname = bodyObj.last_name
  var pc = bodyObj.profile_pic
 var locale = bodyObj.locale
var timezone = bodyObj.timezone
var gender = bodyObj.gender
  
  console.log(JSON.parse(body))
    
var messageData = {
recipient:{
id: recipientId
},
  message:{
  attachment:{
  type:"template",
    payload:{
    template_type:"button",
      text:"Hello! Welcome to ChatBot " +name+ " " +lname+ " :) ",
      buttons:[{
      type:"postback",
        title:"Start Now",
        payload:"start"
        
      },]
    }
  }
  }
};
    callSendAPI(messageData);
  }
  })
}

//when press start now
function sendstart (recipientId){

  request ({
  url:"https://graph.facebook.com/v2.6/" + recipientId ,
    qs:{
    access_token:process.env.PAGE_ACCESS_TOKEN,
      fields:""
    
    },
    method:"GET",
    
  
  },function (error, response, body){
  if(error){
  console.log("error getting username")
  }else{
  
  var bodyObj = JSON.parse(body)
var name = bodyObj.first_name
  var lname = bodyObj.last_name
  var pc = bodyObj.profile_pic
 var locale = bodyObj.locale
var timezone = bodyObj.timezone
var gender = bodyObj.gender
  
  console.log(JSON.parse(body))
    
var messageData = {
recipient:{
id: recipientId
},
  message:{
  attachment:{
  type:"template",
    payload:{
    template_type:"button",
      text:" ;) " +name+ " " +lname+ " ;) ",
      buttons:[{
      type:"postback",
        title:"Menu 1",
        payload:"menu1"
        
      },
      {
        type: "postback",
          title:"Menu 2",
        payload:"menu2"
      },
      {
        type: "postback",
          title:"Menu 3",
        payload:"menu3"
      }]
    }
  }
  }
};
    callSendAPI(messageData);
  }
  })
}

//when press menu button
function sendsections(recipientId){
  var messageData = {
    recipient:{
      id: recipientId
    },
    message:{
    attachment:{
    type:"template",
    payload:{
      template_type:"button",
      text:" Menu 1 ",
      buttons:[{
        type:"postback",
        title:"Section 1",
        payload:"section1"
        
      },
      {
        type: "postback",
          title:"Section 2",
        payload:"section2"
      },
      {
        type: "postback",
          title:"Section 3",
        payload:"section3"
      }]
    }
  }
  }
};
    callSendAPI(messageData);
  }

//when press section button
function sendquickreply1(recipientId){
  var messageData = {
    recipient:{
      id: recipientId
    },
    message:{
      "text": "Message for the quick reply payload",
        "quick_replies": [{
          "content_type": "text",
          "title": "No 1",
          "payload": "quick1"
        },
        {
          "content_type": "text",
          "title": "No 2",
          "payload": "quick1"
        },
                          {
          "content_type": "text",
          "title": "No 3",
          "payload": "quick1"
        },
                          {
          "content_type": "text",
          "title": "No 4",
          "payload": "quick1"
        },
        {
          "content_type": "text",
          "title": "No 5",
          "payload": "quick1"
        },
        {
          "content_type": "text",
          "title": "No 6",
          "payload": "quick1"
        },
        {
          "content_type": "text",
          "title": "No 7",
          "payload": "quick1"
        }, 
        {
          "content_type": "text",
          "title": "No 8",
          "payload": "quick1"
        },
        {
          "content_type": "text",
          "title": "No 9",
          "payload": "quick1"
        },
        {
          "content_type": "text",
          "title": "No 10",
          "payload": "quick1"
        }
      ]

}};
  
console.log("quick 1 test success");
  callSendAPI(messageData)
  
//////////////////////////////
  
}  

//when press quick reply 2 payload
function sendQuickReply(senderID, quickReply, messageId, messageText){
  var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
  if(quickReplyPayload){
    //puzzle
    switch(quickReplyPayload){
           case 'quick1':
           
        //console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload, messageText);
        if(messageText){
        switch(messageText){
          case 'No 1':
            //sendTextMessage(senderID, "Yes. I receive the quick reply 1. Thanks :)");
            sendphoto(senderID);
            break;
            
          case 'No 2':
            sendTextMessage(senderID, "Yes. I receive the quick reply 2. Thanks :)");
            break;
            
          case 'No 3':
            //sendTextMessage(senderID, "Yes. I receive the quick reply 2. Thanks :)");
            sendaudio(senderID);
            break;
            
            case 'No 4':
            //sendTextMessage(senderID, "Yes. I receive the quick reply 2. Thanks :)");
            sendVideo(senderID);
            break;
        }
    }
        break;
      default:
        sendTextMessage(senderID, "Payload not defined");
           }
  }
}

//when press quick reply 1 payload
function sendphoto(recipientId){
const get_random_photo = ((ar) => ( ar[ Math.floor( Math.random() * ar.length ) ] ))
var photo1 = "https://images.pexels.com/photos/982865/pexels-photo-982865.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260";

const photo = [photo1]

{
 var messageData = {   
   recipient: {
        id: recipientId
    },
    message: {
        attachment: {
            type: "image",
            payload: {
                url: get_random_photo( photo )
            }
        }
    }
}
}
callSendAPI(messageData);}

//when press quick reply 3 payload reply audio
function sendaudio(recipientId){
const get_random_song = ((ar) => ( ar[ Math.floor( Math.random() * ar.length ) ] ))
var song1 = "http://docs.google.com/uc?export=open&id=0B80xfrsPl23cZ044YW1QMWI1QW8"; 
const song = [song1]

{
 var messageData = {   
   recipient: {
        id: recipientId
    },
    message: {
        attachment: {
            type: "audio",
            payload: {
                url: get_random_song( song )
            }
        }
    }
}
}
callSendAPI(messageData);}

//when press quick reply 4 payload reply video
function sendVideo(recipientId){
const get_random_Video = ((ar) => ( ar[ Math.floor( Math.random() * ar.length ) ] ))
var Video1 = "https://dl.dropbox.com/s/vt1rjfouyrtggrz/VID-20171022-WA0025.mp4?dl=0";

const Video = [Video1]

{
 var messageData = {   
   recipient: {
        id: recipientId
    },
    message: {
        attachment: {
            type: "video",
            payload: {
                url: get_random_Video( Video )
            }
        }
    }
}      
}
callSendAPI(messageData);}

function defaultanswer(recipientId, messageId,messageText,senderID) { 
  
// Get Data From a Google Sheet
  var google_sheet_json = "https://spreadsheets.google.com/feeds/list/" + process.env.GOOGLE_SHEET_ID +"/1/public/values?alt=json";
  request.get(google_sheet_json, function (err, res, body) {
    if (!err) {
      var bot_script_obj = JSON.parse(body);
      var all_bot_scripts = bot_script_obj.feed.entry;
   // var len = all_bot_scripts.length;
       var len = all_bot_scripts.length;
     // console.log(len);
       //  var len = 6
      var all_keywords = [];
      var i = 0
      
      for (; i < len; ) {
   //console.log(messageText.includes(bot_script_obj.feed.entry[i].gsx$incoming.$t));
     // console.log(bot_script_obj.feed.entry[i].gsx$incoming.$t,messageText)
      console.log(i);
   // console.log(messageText)
       
        if (messageText === (bot_script_obj.feed.entry[i].gsx$incoming.$t)){
          console.log(bot_script_obj.feed.entry[i].gsx$incoming.$t,messageText)
        var outtext = bot_script_obj.feed.entry[i].gsx$outgoing.$t;
        var messageData = {
            recipient: {
              id: recipientId
            },
            message: {
              text: outtext
            }
          };
        callSendAPI(messageData);
        break;  
          
        }
if ( len === 4 && i === 3 ) {//console.log(messageText,"not found");
        sendTextMessage(recipientId, "Sorry, there was an error in sending your message. Please try again");
        }
        i++
       
        
      } 
              } else {
console.log(err);
    }
  });
}
