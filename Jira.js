//Jira's APIs

var request = require("request");
var fs = require('fs');
//Create Issue
exports.CreateIssue =function (projectName, summary, description, issuetype, domain, Token,callBackDB,messageID,channelID,callBackAttach,path)
{
    request({
        headers:{Authorization: Token},
      uri: `https://${domain}.atlassian.net/rest/api/2/issue`,
        body:{
        "fields": {
          "project":
          {
             "key": projectName
          },
          "summary": summary,
          "description": description,
          "issuetype": {
             "name": issuetype,
          }}},
      method: 'POST',
      json: true,
      
    }
    , function(error, response, body) {
      console.log(body);
      console.log(error);
      if(error)
        {
            console.log(error, null);
            return;
        }
    if (response.statusCode === 201)
        {
            console.log("Issue Posted.");
            console.log(body);
            if(typeof callBackAttach==='function'){
                callBackAttach(body.key,path,domain,Token);
                callBackDB(body.id,messageID,channelID);

            }
            else { callBackDB(body.id,messageID,channelID); }
            return body;
        }
    if (response.statusCode === 400)
        {
            console.log(response.statusCode + ':  error.');
            return;
        };
    });
}
//Delete Issue
exports.DeleteIssue = function (IssueID, domain, Token)
{
    request({
        headers:{Authorization: Token },
      uri: `https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}`,
      method: 'DELETE',
      json: true
    }, function(error, response, body) {
        console.log(body.errorMessages[0],"heree");
      if(error)
        {
            console.log(error, null);
            return;
        }
    if (response.statusCode === 204)
        {
            console.log("Deleted.");
            return;
        }
    if (response.statusCode === 400)
        {
            console.log(response.statusCode + ':  error.');
            return;
        };
    });

}
//Add Comment
exports.AddComment =function (IssueID, comment, domain, Token,callBackDB,messageID,threadID)
{
    request({
        headers:{Authorization: Token },
      uri: `https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}/comment`,
      body: {
        "body": comment
      },
      method: 'POST',
      json: true
    }, function(error, response, body) {
      
      callBackDB(messageID,body.id,threadID);
      if(error)
        {
            console.log(error, null);
            return;
        }
    if (response.statusCode === 201)
        {
            console.log("Comment Posted.");
            return;
        }
    if (response.statusCode === 400)
        {
            console.log(response.statusCode + ':  error.');
            return;
        };
    });
}
//Delete Comment
exports.DeleteComment = function (IssueID, CommentID, domain, Token)
{
    request({
        headers:{Authorization: Token},
      uri: `https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}/comment/${CommentID}`,
      method: 'DELETE',
      json: true
    }, function(error, response, body) {
      if(error)
        {
            console.log(error, null);
            return;
        }
    if (response.statusCode === 204)
        {
            console.log("Deleted.");
            return;
        }
    if (response.statusCode === 400)
        {
            console.log(response.statusCode + ':  error.');
            return;
        };
    });
}
//Edit Comment
exports.EditComment = function (IssueID, CommentID, UpdatedComment, domain, Token)
{
    request({
        headers:{Authorization: Token },
      uri: `https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}/comment/${CommentID}`,
      method: 'PUT',
      body: {
        "body": UpdatedComment
      },
      json: true
    }, function(error, response, body) {
      if(error)
        {
            console.log(error, null);
            return;
        }
    if (response.statusCode === 200)
        {
            console.log("Updated.");
            return;
        }
    if (response.statusCode === 400)
        {
            console.log(response.statusCode + ':  error.');
            console.log(error);
            return;
        };
    });

}
//Add Attachment
exports.AddAttachment = function (IssueID, Attachment, domain, Token){
    var formData = {
      file: fs.createReadStream(Attachment),
    };
    
    request({
      headers:{Authorization: Token,
      'X-Atlassian-Token': 'no-check'
  },
        uri:`https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}/attachments`,
         formData: formData,
        method :'POST',
        json: true
      }, function(err, response, body) {
      if (err) {
        return console.error('upload failed:', err);
      }
      console.log('Upload successful!');
      fs.unlink(Attachment,function(err){
       console.log("file deleted");
      });
    });
  }
//CreateIssue ("MM", "BUG", "ai7aga", "Bug", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//DeleteIssue("MM-28", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//AddComment("MM-29","hai", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//EditComment("MM-29","10026","hey", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//DeleteComment("MM-29", 10025);
//AddAttachment("MM-29","Documents\\ProjectTactful\\try.txt","jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");