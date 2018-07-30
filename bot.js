
var env = require('node-env-file');
var mongoose = require('mongoose');
var http = require('http');
var fs = require('fs');
var request = require('request');
env(__dirname + '/.env');
var Jira = require('./Jira');
var cronJob = require('cron').CronJob;

var outDateIssues = new cronJob('5 8 * * 0', function () {    //run job 8:05 every sunday
  issue.deleteMany({
    ts: { $lte: ((Date.now() / (1000 * 60)) - 43200) },
  }, function (err) {
    if (err) { console.log("err", err) };
  });
  console.log('cronjob started');

},null,true,'Africa/Cairo');

mongoose.connect(process.env.dbString,
  {
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE,
  }
);
var db = mongoose.connection;

var channelSchema = mongoose.Schema({
  channelID: String,
  jiraEncodedToken: String,
  domainName: String
})
var issueSchema = mongoose.Schema({
  channelID: String,
  jiraID: String,
  messageID: String,
  ts: Number,
  domain: String
});
var commentSchema = mongoose.Schema({
  channelID: String,
  jiraID: String,
  jiraCommentID: String,
  commentID: String
});
var channel = mongoose.model('channel', channelSchema);
var comment = mongoose.model('comment', commentSchema);
var issue = mongoose.model('issue', issueSchema);
db.once('open', function () {
  console.log("database ready");


});
if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT || !process.env.botToken || !process.env.dbString) {
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
/*
//Post message on slack when issue state updated
function MsgOnSlack(textmsg, channelID) {
      request.post({
      url:"https://slack.com/api/chat.postMessage",
      options: {
        token : process.env.botToken,
        text: textmsg,
        channel: channelID
      }
    },function(err, res, body)
  {
    if(err)
      {
        console.log("err");
      }
      //console.log(res);

  })
  }
  */
var controller = Botkit.slackbot(bot_options);

controller.setupWebserver(3000, (err, webserver) => {
  if (err) {
    console.log('Server Creation Error ! : ', err)
  } else {
    controller.createWebhookEndpoints(webserver);
    controller.createOauthEndpoints(webserver);

    ///
    webserver.post('/jiraAPI', function (req, res) {
      var projectkey = req.body.issue.key;
      var state = req.body.issue.fields.status.name;
      var Jiraid = req.body.issue.id;
      var path = req.body.issue.self;
      var end = path.indexOf('.');
      //console.log(end);
      var Domain = path.slice(8, end);

      if (state !== "To Do") {
        console.log(state);
        //console.log(Jiraid);
        console.log(Domain);
        res.send(req.body);
        var idOfChannel = channel.findOne({jiraID : Jiraid, Domain : Domain },function(err, res){
          if(err)
            console.log(err);
          console.log(res);
        });
        //MsgOnSlack("Issue "+projectkey+" Updated to "+state, idOfChannel);
      }
    });
  }
});
function findCreds(channelIDD){
  return new Promise(function(resolve,reject){
    channel.findOne({channelID:channelIDD},function(err,data){
      if(err){console.log(err);}
      console.log("data");
      resolve(data);
     });


  });
  
}
function determineIssueType(text){
  if(/#bug/.test(text)){ return 'Bug'; }
  else if(/#task/.test(text)){return 'Task';}
  else if(/#story/.test(text)){return 'Story';}
  else if(/#epic/.test(text)){return 'epic';}
  return null;

}

function addIssueDB(jiraIDD,messageIDD,channelIDD,domain){
  var newMesage=new issue({
    jiraID:jiraIDD,
    messageID:messageIDD,
    ts:Math.round((Date.now()/(1000*60))),   // date in minutes
    channelID:channelIDD,
    domain:domain
    });
    newMesage.save(function(err,newq){
      if(err){console.log(err,'err')};
      console.log(newq,"newq");
    });

}
function addCommentDB(commentIDD,jiraCommentIDD,threadID,channelIDD){
  var newComment=new comment({
    jiraCommentID:jiraCommentIDD,
    commentID:commentIDD,
    channelID:channelIDD
   });
   newComment.save(function(err,newc){
   if(err){console.log(err,'err');}
   console.log(newc);

    issue.findOneAndUpdate({ messageID: threadID }, { ts: (Date.now() / (1000 * 60)) }, function (err, data) { //update thread ts
      if (err) { console.log(err); }
    });

  });


}



controller.on('file_share', function(bot, message) {

  console.log(message);
  var destination_path = './uploadedfiles/' + message.files[0].name;
  var url = message.files[0].url_private;
  var title=message.files[0].title;
  var comment=message.raw_message.event.text===undefined?'No Comment':message.raw_message.event.text;
  var messageId=message.ts;
  var type;
  console.log(title,comment,messageId);
 if( determineIssueType(comment)!=null || determineIssueType(title)!=null ){
   type=determineIssueType(comment)?determineIssueType(comment):determineIssueType(title);
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
     findCreds(channelIDD).then(function(data){
    
      domain=data.domainName;
      token=data.jiraEncodedToken;
     Jira.CreateIssue("JIRA",title,comment,type, domain, token,addIssueDB,message.ts,message.event.channel,Jira.AddAttachment,destination_path).then((body) => {
      botTalk.showMessage(body, message );
    }).catch((err) => {
      botTalk.showErrorMessage(err.message, message);
    });
  })
   });
  request(options, function(err, res, body) {
      // body contains the content
      bot.replyInThread(message, 'You posted an issue with an image');
      console.log('FILE RETRIEVE STATUS', res.statusCode);
    }).pipe(picStream); // pipe output to filesystem
  }
});
var botTalk=require('./botTalk');
botTalk.slash(controller);

//function to determine message type
function determineType(ReqBody,slackBot){
  var text=ReqBody.raw_message.event.text;
  var threadTs=ReqBody.raw_message.event.thread_ts;
  var previousMessage=ReqBody.raw_message.event.previous_message;
  var channelIDD=ReqBody.event.channel;
  var eventTs=ReqBody.raw_message.event.ts;
  var  subType=ReqBody.raw_message.event.subtype;
  var messageRaw=ReqBody.raw_message.event.message;
  var domain,token;
  var type=determineIssueType(text);
  findCreds(channelIDD).then(function(dataa){
    
    domain=dataa.domainName;
    token=dataa.jiraEncodedToken;
  
    if(ReqBody.raw_message.event.bot_id!==undefined){
      //ignore
    }
    else if(typeof threadTs!=='undefined' ){     //reply on thread not a new issue
      console.log("you added a new comment");
      issue.findOne({messageID:threadTs, channelID:channelIDD},function(err,data){
        if(err){console.log(err);}
      
        if(data!=null){
          Jira.AddComment(data.jiraID,text,domain, token,addCommentDB,eventTs,threadTs,channelIDD).then((body) => {
            botTalk.showMessage(err, ReqBody,controller);
          }).catch((err) => {
            botTalk.showErrorMessage(err, ReqBody,controller);
          })
        }
      });
    }
    else if(typeof previousMessage!=='undefined' && typeof previousMessage.thread_ts!=='undefined' && subType==='message_deleted'){
    issue.findOne({messageID:previousMessage.thread_ts,channelID:channelIDD},function(err,dataI){
      comment.findOneAndRemove({commentID:previousMessage.ts,channelID:channelIDD},function(err,dataC){
        Jira.DeleteComment(dataI.jiraID,dataC.jiraCommentID,domain, token).then((body) => {
          botTalk.showMessage(err, ReqBody,controller);
        }).catch((err) => {
          botTalk.showErrorMessage(err, ReqBody,controller);
        });
      })
    });
  } else if (typeof previousMessage!=='undefined' && typeof previousMessage.thread_ts!=='undefined' && messageRaw.reply_count===undefined){
    issue.findOne({messageID:previousMessage.thread_ts},function(err,dataI){
      console.log(previousMessage.ts,'heree');
      comment.findOne({commentID:previousMessage.ts,channelID:channelIDD},function(err,dataC){
        Jira.EditComment(dataI.jiraID,dataC.jiraCommentID,messageRaw.text,domain, token).then((body) => {
          botTalk.showMessage(err, ReqBody,controller);
        }).catch((err) => {
        botTalk.showErrorMessage(err.message, ReqBody);
        })
      });
    });
  } else if (subType==='message_deleted' ||( messageRaw!=undefined && messageRaw.subtype==='tombstone')){
    console.log("message deleted");
    issue.findOneAndRemove({messageID:previousMessage.ts,channelID:channelIDD},function(err,data){
        Jira.DeleteIssue(data.jiraID,domain, token).then((body) => {
          botTalk.showMessage(err, ReqBody,controller);
        }).catch((err) => {
        botTalk.showErrorMessage(err, ReqBody,controller);
      })

    });
    //issue.deleteOne({messageID:previousMessage.ts},function(err)
    console.log("Deleted from db");
  } else if (subType === 'message_changed' && messageRaw.text !== previousMessage.text) {
    console.log("message changed", subType, ReqBody.raw_message.event.bot_id);
    //threadTs=messageRaw.thread_ts;
    slackBot.replyInThread(ReqBody, "hi dude you edited this messsage");
  } else if (subType === 'file_share') {
    //do nothing slack controller will handle this
  } else if(threadTs===undefined && text!==undefined && type!==null){ //recieve a message without file
    console.log("New message recieved");
    Jira.CreateIssue("JIRA",text,text,type, domain, token,addIssueDB,eventTs,channelIDD).then((body) => {
      botTalk.showMessage(body, ReqBody,controller);
    }).catch((err) => {
      botTalk.showErrorMessage(err.message, ReqBody,controller);
    })
    slackBot.replyInThread(ReqBody, "hi dude you added a new message");
  }
    
  });
  
    
}

//Start of the bot conversation







controller.on('dialog_submission', (bot, message) => {

  var submission = message.submission;
  var combinedString = `${submission.username}:${submission.token}`;
  var encodedString = Buffer.from(combinedString).toString('base64');
  encodedString = 'Basic ' + encodedString;
  var domainName = submission.domain;
  bot.dialogOk();
  bot.reply(message, 'Got it!');
  var n_channel = channel({
    channelID: message.channel,
    jiraEncodedToken: encodedString,
    domainName: domainName
  })
  n_channel.save((err, usr) => {
    if (err) {
      console.log('cannot save channel !', err)
    } else {
      console.log('Channel Saved !', usr)
    }
  })
});

controller.middleware.receive.use((bot, message, next) => {
   //console.log(message);
  if(message.command!==undefined || message.type==='dialog_submission'){ next();}
    var channelID = message.raw_message.event.channel;
    channel.findOne({'channelID': channelID}, (err, usr) => {
      if(err){
        console.log('err', err);
      } else if(usr === null) {
        controller.storage.teams.get(message.team_id, (err, data) => {
          if (err) {
            console.log('Cannot get team data !', err)
          } else {
            let token = data.bot.token
            let errM = 'Opps !, Looks like you did\'t register your jira account, please use the slash command \\initt to register'
            let reqURL = `https://slack.com/api/chat.postEphemeral?token=${token}&channel=${message.channel}&text=${errM}&user=${message.user}`
            request.post(reqURL, (err, res, body)=> {
              if (err){
                console.log('ERR', err)
              } else {
                console.log('BODYN', body)
              }
            })
          }
        })
      }
      else{
        determineType(message,bot);
      }
    });
  next();
});

