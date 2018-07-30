//Jira's APIs

var request = require("request");
var fs = require('fs');
//Create Issue
exports.CreateIssue =function (projectName, summary, description, issuetype, domain, Token,callBackDB,messageID,channelID,callBackAttach,path)
{   
    return new Promise((resolve, reject) => {
        request({
            headers:{Authorization: Token},
          uri: `https://${domain}.atlassian.net/rest/api/2/issue`,
            body:{
            "fields": {
              "project":{
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
                reject("Connection Error!");
            }
        if (response.statusCode === 201)
            {
                console.log("Issue Posted.");
                console.log(body);
                if(typeof callBackAttach==='function'){
                    callBackAttach(body.key,path,domain,Token);
                    callBackDB(body.id,messageID,channelID,domain);
    
                }
                else {
                    callBackDB(body.id,messageID,channelID,domain);
                }
                resolve("Issue Created !");
            }
        if (response.statusCode === 400)
            {
                console.log(response.statusCode + ':  error.');
                reject(new Error('Something Went Wrong'));
            };
        });
    });
}
//Delete Issue
exports.DeleteIssue = function (IssueID, domain, Token)
{
    return new Promise((resolve, reject) => {
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
                reject("Connection Error");
            }
        if (response.statusCode === 204)
            {
                console.log("Deleted.");
                resolve("Issue Deleted");
            }
        if (response.statusCode === 400)
            {
                console.log(response.statusCode + ':  error.');
                reject("Somthing Went Wrong");
            };
        });
    });
}
//Add Comment
exports.AddComment =function (IssueID, comment, domain, Token,callBackDB,messageID,threadID,channelIDD)
{
    console.log("hi coment");
    return new Promise((resolve, reject) => {
        request({
            headers:{Authorization: Token },
          uri: `https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}/comment`,
          body: {
            "body": comment
          },
          method: 'POST',
          json: true
        }, function(error, response, body) {
          
          callBackDB(messageID,body.id,threadID,channelIDD);
          if(error)
            {
                console.log(error, null);
                reject("Connection Error");
            }
        if (response.statusCode === 201)
            {
                console.log("Comment Posted.");
                resolve("Comment Added");
            }
        if (response.statusCode === 400)
            {
                console.log(response.statusCode + ':  error.');
                reject("Somthing Went Wrong");
            };
        });
    });
}
//Delete Comment
exports.DeleteComment = function (IssueID, CommentID, domain, Token) //todo remove comment from db
{
    return new Promise((resolve, reject) => {
        request({
            headers:{Authorization: Token},
            uri: `https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}/comment/${CommentID}`,
            method: 'DELETE',
            json: true
        }, function(error, response, body) {
          if(error)
            {
                console.log(error, null);
                reject("Connection Error");
            }
        if (response.statusCode === 204)
            {
                console.log("Deleted.");
                resolve("Comment Deleted !");
            }
        if (response.statusCode === 400)
            {
                console.log(response.statusCode + ':  error.');
                reject("Somthing Went Wrong");
            };
        });
    });
}
//Edit Comment
exports.EditComment = function (IssueID, CommentID, UpdatedComment, domain, Token)
{
    return new Promise((resolve, reject) => {
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
                reject("Connection Error");
            }
        if (response.statusCode === 200)
            {
                console.log("Updated.");
                resolve("Comment Editted !");
            }
        if (response.statusCode === 400)
            {
                console.log(response.statusCode + ':  error.');
                console.log(error);
                reject("Opps! Somthing Went wrong");
            };
        });
    });
}
//Add Attachment
exports.AddAttachment = function (IssueID, Attachment, domain, Token){
    return new Promise((resolve, reject) => {
    
        var formData = {
            file: fs.createReadStream(Attachment),
          };
        request({
            headers:{
                Authorization: Token,
                'X-Atlassian-Token': 'no-check'
            },
            uri:`https://${domain}.atlassian.net/rest/api/2/issue/${IssueID}/attachments`,
            formData: formData,
            method :'POST',
            json: true
            },
            function(err, response, body) {
                if (err) {
                    reject("Connection Error");
                } else {
                    console.log('Upload successful!');
                    fs.unlink(Attachment,function(err){
                        console.log("file deleted");
                    });
                    resolve("Done");
                }
            }
        );
    });
  }
//CreateIssue ("MM", "BUG", "ai7aga", "Bug", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//DeleteIssue("MM-28", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//AddComment("MM-29","hai", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//EditComment("MM-29","10026","hey", "jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");
//DeleteComment("MM-29", 10025);
//AddAttachment("MM-29","Documents\\ProjectTactful\\try.txt","jirabottac", "Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==");