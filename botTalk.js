var request=require('request');
exports.slash=(function(controller){
    controller.hears(['help'],'direct_message,direct_mention,mention', function(bot, message) {
        console.log(message);
       bot.reply(message,"Hello <@"+message.user +"> i'm here to help delivering your issues to jira and notify you with changes");
      });
      controller.hears(['hello', 'hi'],'direct_message,direct_mention,mention', function(bot, message) {
       bot.reply(message,"Greetings Master");

       

      
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

      controller.middleware.receive.use((bot, message, next) => {
        if (message.type === 'dialog_submission') {
          console.log('Catched Dialog Reply ! ', message);
        }
        next();
      });



      

});



exports.showMessage = (error, message,controller) => {
    controller.storage.teams.get(message.team_id, (err, data) => {
      if (err) {
        console.log('Cannot get team data !', err)
      } else {
        console.log("MESSAGE USER ", message.user)
        console.log("MESSAGE CHANNEL ", message.channel)
        console.log("MESSAGE ",message)
        // let token = data.bot.token
        let token = process.env.botToken
        console.log("TOKEN ",token)
        let reqURL = `https://slack.com/api/chat.postEphemeral?token=${token}&channel=${message.channel}&text=${error}&user=${message.user}`
        request.post(reqURL, (err, res, body)=> {
          if (err){
            console.log('ERR', err)
          } else {
            console.log('BODY !! ', body)
          }
        });
      }
    });
  }
  
  exports.showErrorMessage = (error, message,controller) => {
    controller.storage.teams.get(message.team_id, (err, data) => {
      if (err) {
        console.log('Cannot get team data !', err)
      } else {
        let token = data.bot.token
        // let reqURL = `https://slack.com/api/chat.postEphemeral?token=${token}&channel=${message.channel}&user=${message.user}&text=${error}`
        let reqURL = "https://slack.com/api/chat.postEphemeral"
        let b = {
          //"token": token,
          "channel": message.channel,
          "user": message.user,
          "text": error,
          "attachments": [
              {
                  "text": "Do you want to retry ?",
                  "fallback": "You are unable to make this request!",
                  "callback_id": "retry_response",
                  "attachment_type": "default",
                  "actions": [
                      {
                          "name": "game",
                          "text": "Yes!",
                          "type": "button",
                          "value": "y"
                      },
              {
                          "name": "game",
                          "text": "No",
                          "type": "button",
                          "value": "y"
                      }
                  ]
              }
          ]
        }
        request({
          uri: reqURL,
          method: 'POST',
          body: b,
          json: true,
          headers: {
            "Content-type": "application/json; charset=utf-8",
            "Authorization": `Bearer ${token}`
          }
        },(err, res, body)=> {
          if (err){
            console.log('ERR', err)
          } else {
            console.log('BODY', body)
          }
        });
      }
    });
  }
  


