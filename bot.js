
var env = require('node-env-file');
var mongoose=require('mongoose');       
var http=require('http');
var fs = require('fs');
var request=require('request');
env(__dirname + '/.env');
var Jira = require('./Jira');

var domain="jirabottac";
var token="Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==";
var encodedString,domainName;
mongoose.connect('mongodb://user1:user1pw@ds131711.mlab.com:31711/jirabot',{
  keepAlive:true,
  reconnectTries:Number.MAX_VALUE,
});
var db=mongoose.connection;

var userSchema=mongoose.Schema({
userID:String,
jiraEncodedToken:String,
domainName:String
});
var issueSchema=mongoose.Schema({
jiraID:String,
messageID:String
});
var commentSchema=mongoose.Schema({
   jiraID:String,
   jiraCommentID:String,
   commentID:String
});
var user=mongoose.model('user',userSchema);
var comment=mongoose.model('comment',commentSchema);
var issue=mongoose.model('issue',issueSchema);
db.once('open',function() 
{
  console.log("database ready");
  
	
});
if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT ||!process.env.botToken) {
  console.log("please provide envs");
  
}

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');
var bot_options = {
	clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  // debug: true,
  token: process.env.botToken,
	scopes: ['bot'],
	studio_token: process.env.studio_token,
	studio_command_uri: process.env.studio_command_uri
};
bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format

var controller = Botkit.slackbot(bot_options);

controller.setupWebserver(4300, (err, webserver) => {
  if (err) { 
      console.log('Server Creation Error ! : ', err)
  } else { 
      controller.createWebhookEndpoints(webserver);
      controller.createOauthEndpoints(webserver);
  }
});

// var slackBot=controller.spawn({
// token: process.env.botToken
// });
// slackBot.startRTM();


// controller.startTicking();

// var webserver = require(__dirname + '/components/express_webserver.js')(controller);
// webserver.post('/challenge',function(req,res){
  
//   if(req.body.challenge!==undefined){
//     res.send(req.body.challenge);

//   }
//   else { determineType(req.body); }
//   //req.body.event.text
  
// });

function addIssueDB(jiraIDD,messageIDD){
  var newMesage=new issue({
    jiraID:jiraIDD,
    messageID:messageIDD
    });
    newMesage.save(function(err,newq){
      if(err){console.log(err,'err')};
      console.log(newq,"newq");
    });

}
function addCommentDB(commentIDD,jiraCommentIDD){
  var newComment=new comment({
    jiraCommentID:jiraCommentIDD,
    commentID:commentIDD
   });
   newComment.save(function(err,newc){
   if(err){console.log(err,'err');}
   console.log(newc);

   });


}

controller.on('message_received', function(bot, message) {
  console.log("something happend");
});

controller.on('file_share', function(bot, message) {
  console.log(encodedString,domainName);
  var destination_path = './uploadedfiles/'+message.file.name;
  var url = message.file.url_private;
  var title=message.file.title;
  var comment=message.file.initial_comment===undefined?'No Comment':message.file.initial_comment.comment;
  var messageId=message.ts;
  console.log(title,comment,messageId);
 
  var options = {
      method: 'GET',
      url: url,
      headers: {
        Authorization: 'Bearer ' + process.env.botToken, 
      }
  };
   var picStream=fs.createWriteStream(destination_path);
   picStream.on('close',function(){
     console.log("finished streaming");
     var respBody=Jira.CreateIssue("MM",title,comment,"Bug", domain, token,addIssueDB,message.ts,Jira.AddAttachment,destination_path);
   });
  request(options, function(err, res, body) {
      // body contains the content
      bot.replyInThread(message,'You posted an issue with an image');
      console.log('FILE RETRIEVE STATUS',res.statusCode);          
  }).pipe(picStream); // pipe output to filesystem
});
  
     //function to determine message type
     function determineType(ReqBody){
       if(ReqBody.event.bot_id!==undefined){
         //ignore
       }
       else if(typeof ReqBody.event.thread_ts!=='undefined' ){     //reply on thread not a new issue
         console.log("you added a new comment");
         
         issue.findOne({messageID:ReqBody.event.thread_ts},function(err,data){
           if(err){console.log(err);}
          Jira.AddComment(data.jiraID,ReqBody.event.text,domain, token,addCommentDB,ReqBody.event.ts)
 
         });
       }
       else if(typeof ReqBody.event.previous_message!=='undefined' && typeof ReqBody.event.previous_message.thread_ts!=='undefined' && ReqBody.event.subtype==='message_deleted'){
        issue.findOne({messageID:ReqBody.event.previous_message.thread_ts},function(err,dataI){
          comment.findOneAndRemove({commentID:ReqBody.event.previous_message.ts},function(err,dataC){
            Jira.DeleteComment(dataI.jiraID,dataC.jiraCommentID,domain, token);
          });
          
       });
      }
       else if(typeof ReqBody.event.previous_message!=='undefined' && typeof ReqBody.event.previous_message.thread_ts!=='undefined' && ReqBody.event.message.reply_count===undefined){
        issue.findOne({messageID:ReqBody.event.previous_message.thread_ts},function(err,dataI){
          console.log(ReqBody.event.previous_message.ts,'heree');
          comment.findOne({commentID:ReqBody.event.previous_message.ts},function(err,dataC){
            
           Jira.EditComment(dataI.jiraID,dataC.jiraCommentID,ReqBody.event.message.text,domain, token);
          });                                  
          
        });
         

       }
      else if(ReqBody.event.subtype==='message_deleted' ||( ReqBody.event.message!=undefined && ReqBody.event.message.subtype==='tombstone')){
        console.log("message deleted");
        issue.findOneAndRemove({messageID:ReqBody.event.previous_message.ts},function(err,data){
           Jira.DeleteIssue(data.jiraID,domain, token);
          
        });
        //issue.deleteOne({messageID:ReqBody.event.previous_message.ts},function(err)
      
        console.log("Deleted from db");
      }
    
      else if(ReqBody.event.subtype==='message_changed' && ReqBody.event.message.text!==ReqBody.event.previous_message.text){
        console.log("message changed",ReqBody.event.subtype,ReqBody.event.bot_id);
        
        ReqBody.event.thread_ts=ReqBody.event.message.thread_ts;
          slackBot.replyInThread(ReqBody.event,"hi dude you edited this messsage");
          
        
      }
      else if(ReqBody.event.subtype==='file_share'){
        //do nothing slack controller will handle this
      }
      else if(ReqBody.event.thread_ts===undefined && ReqBody.event.text!==undefined){ //recieve a message without file
        console.log("New message recieved");

        
          var respBody=Jira.CreateIssue("MM",ReqBody.event.text,ReqBody.event.text,"Bug", domain, token,addIssueDB,ReqBody.event.ts);

          
          slackBot.replyInThread(ReqBody.event,"hi dude you added a new message");
          

        

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

controller.middleware.receive.use((bot, message, next) => {
  
  if (message.type === 'dialog_submission') {
    console.log('Catched Dialog Reply ! ', message);
  }
  next();
});

controller.on('slash_command', (bot, message) => {
  bot.replyPrivate(message, 'Ok Working on!');
  var info = message.text.split(',');
  var dialog = bot.createDialog('Jira Initialization Form', 'jira-init', 'Submit')
  .addText('Username', 'username', info[0] || '')
  .addText('Authentication Token', 'token', info[1] || '')
  .addText('Domain', 'domain', '');
  bot.replyWithDialog(message, dialog.asObject(), (err, res) => {
    // console.log(res);
  });
});

controller.on('dialog_submission', (bot, message) => {
  var submission = message.submission;
  var combinedString = `${submission.username}:${submission.token}`;
  encodedString = Buffer.from(combinedString).toString('base64');
  encodedString='Basic '+encodedString;
  domainName = submission.domain;
  bot.dialogOk();
  bot.reply(message, 'Got it!');
  var n_user = user({
    userID: message.user,
    jiraEncodedToken: encodedString,
    domainName: domainName
  })
  n_user.save((err, usr) =>{ 
    if (err) {
      console.log('cannot save user !', err)
    } else {
      console.log('User Saved !', usr)
    }
  })
});

controller.middleware.receive.use((bot, message, next) => {
  // console.log(message)
  if (message.type == 'ambient') {
    var userID = message.event.user
    user.findOne({'userID': userID}, (err, usr) => {
      if(err){
        console.log('err', err);
      } else if(usr === null) {
        controller.storage.teams.get(message.team_id, (err, data) => {
          if (err) {
            console.log('Cannot get team data !', err)
          } else {
            let token = data.bot.token
            let errM = 'Opps !, Looks like you did\'t register your jira account, please use the slash commant \\init to register'
            let reqURL = `https://slack.com/api/chat.postEphemeral?token=${token}&channel=${message.channel}&text=${errM}&user=${message.user}`
            request.post(reqURL, (err, res, body)=> {
              if (err){
                console.log('ERR', err)
              } else {
                console.log('BODY', body)
              }
            })
          }
        })
      }
    })
  }
  next()
});