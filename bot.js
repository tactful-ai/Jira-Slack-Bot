
var env = require('node-env-file');
var mongoose=require('mongoose');       
var http=require('http');
var request=require('request');
env(__dirname + '/.env');


mongoose.connect('mongodb://user1:user1pw@ds131711.mlab.com:31711/jirabot',{
  keepAlive:true,
  reconnectTries:Number.MAX_VALUE,
});
var db=mongoose.connection;
var mongooseSchema=mongoose.Schema({
jiraID:String,
messageID:String
});
var model=mongoose.model('jm',mongooseSchema);
db.once('open',function() 
{
  console.log("database ready");
  
	
});
if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT ||!process.env.botToken) {
  console.log("please provide required envs");
  // process.exit(1);
}

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');
var bot_options = {
	clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
	// debug: true,
	scopes: ['bot'],
	studio_token: process.env.studio_token,
	studio_command_uri: process.env.studio_command_uri
};
bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format


// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku


// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot(bot_options);
var slackBot=controller.spawn({
token: process.env.botToken
});
slackBot.startRTM();


controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);
webserver.post('/challenge',function(req,res){
  
  
  res.send(req.body.challenge);
determineType(req.body);

  //req.body.event.text
  
});



  


  
     //function to determine message type
     function determineType(ReqBody){
      if(ReqBody.event.subtype==='message_deleted'){
        console.log("message deleted");
        model.deleteOne({messageID:ReqBody.event.previous_message.client_msg_id},function(err)
      {
        console.log("Deleted from db");
      });
      }
      else if(ReqBody.event.subtype==='message_changed'){
        console.log("message changed");
      }
      else{
        console.log("New message recieved");
        //linkMessageToJira(ReqBody.event.channel,ReqBody.event.client_msg_id,"jiraid123");
        var newMesage=new model({
        jiraID:"jiraid123",
        messageID:ReqBody.event.client_msg_id
        });
        newMesage.save(function(err,newq){
          if(err){console.log(err)};
          console.log(newq);
        });
      }

     }
     
  

//Start of the bot conversation
controller.hears(['help'],'direct_message,direct_mention,mention', function(bot, message) {
  console.log(message);
 bot.reply(message,"Hello <@"+message.user +"> i'm here to help delivering your issues to jira");
});
controller.hears(['hello', 'hi'],'direct_message,direct_mention,mention', function(bot, message) {
  console.log(message);
 bot.reply(message,"Greetings Master");
console.log("hello");
});
controller.on('direct_message,direct_mention,mention', function(bot, message) {
  console.log(message);
  bot.reply(message,"okaaay");
});

controller.on('slash_command', (bot, message) => {

	var dialog = bot.createDialog('Jira Initialization Form', 'jira-init', 'Submit')
	.addText('Username', 'text', 'Jira Account Username')
	.addText('Authentication Token', 'text1', 'Jira Authentication Token');
	bot.replyWithDialog(message, dialog.asObject(), (err, res) => {
		console.log(res);
	});
	// bot.replyPrivate(message, 'Okay');
	// bot.startConversation(message, (err, convo) => {
	//   convo.addQuestion('Hi !', (response, convo) => {
	//     convo.say('Hi again :D');
	//     convo.next();
	//   }, {}, 'default');
	// });
});

controller.middleware.receive.use((bot, message, next) => {
  
  if (message.type === 'dialog_submission') {
    console.log('Catched Dialog Reply ! ', message);
  }
  next();
});

controller.on('dialog_submission', (bot, message) => {
  console.log("aaa");
  var submission = message.submission;
  console.log(submission);
  bot.dialogOk();
  bot.reply(message, 'Got it!');
  

});

