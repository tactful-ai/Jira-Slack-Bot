var request=require('request');

request({
    headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ=='},
    url:'https://jirabottac.atlassian.net/rest/api/2/issue/MM-9'
  },function(err,res,body){
  //console.log(body);
  });
  request.post({
    headers:{Authorization:'Basic bWFyeWFtbWVoYWJAZ21haWwuY29tOmROYWdqelRyQWlrMDV0blMyY2E1QjE5QQ=='},
      url:'https://jirabottac.atlassian.net/rest/api/2/issue',
      
    },function(err,res,body){
      console.log(body);
    });