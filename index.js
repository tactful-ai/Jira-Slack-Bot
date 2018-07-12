//Jira's APIs

var request = require("request");
var fs = require('fs');
//Create Issue
exports.CreatIssue =function (projectName, summary, description, issuetype)
{
    request({
        headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ=='},
      uri: `https://jirabottac.atlassian.net/rest/api/2/issue`,
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
            return;
        }
    if (response.statusCode === 400)
        {
            console.log(response.statusCode + ':  error.');
            return;
        };
    });
}
//Delete Issue
exports.DeleteIssue = function (IssueID)
{
    request({
        headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ=='},
      uri: `https://jirabottac.atlassian.net/rest/api/2/issue/${IssueID}`,
      method: 'DELETE',
      json: true
    }, function(error, response, body) {
        //console.log(error);
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
exports.AddComment =function (IssueID, comment, callback)
{
    request({
        headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ=='},
      uri: `https://jirabottac.atlassian.net/rest/api/2/issue/${IssueID}/comment`,
      body: {
        "body": comment
      },
      method: 'POST',
      json: true
    }, function(error, response, body) {
      console.log(body);
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
exports.DeleteComment = function (IssueID, CommentID)
{
    request({
        headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ=='},
      uri: `https://jirabottac.atlassian.net/rest/api/2/issue/${IssueID}/comment/${CommentID}`,
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
exports.EditComment = function (IssueID, CommentID, UpdatedComment)
{
    request({
        headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ=='},
      uri: `https://jirabottac.atlassian.net/rest/api/2/issue/${IssueID}/comment/${CommentID}`,
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
exports.AddAttachment = function (IssueID, Attachment){
    var formData = {
      file: fs.createReadStream(Attachment),
    };
    
    request({
      headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ==',
      'X-Atlassian-Token': 'no-check'
  },
        uri:`https://jirabottac.atlassian.net/rest/api/2/issue/${IssueID}/attachments`,
         formData: formData,
        method :'POST',
        json: true
      }, function(err, response, body) {
      if (err) {
        return console.error('upload failed:', err);
      }
      console.log('Upload successful!',response);
    });
  }
//CreatIssue ("MM", "BUG", "ai7aga", "Bug");
//DeleteIssue("MM-28");
//AddComment("MM-29","eslam");
//EditComment("MM-29","10025","islam");
//DeleteComment("MM-29", 10025);
//AddAttachment("MM-29","Documents\\ProjectTactful\\try.txt");