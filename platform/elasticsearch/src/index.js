var AWS = require('aws-sdk');
const axios = require('axios');
const REGION = process.env.AWS_REGION;
const ES_ENDPOINT = process.env.ES_ENDPOINT;



indexDocument = (document,index,type,id) => {
    var domain =ES_ENDPOINT;
    var request = new AWS.HttpRequest(ES_ENDPOINT, REGION);

    request.method = 'PUT';
    request.path += index + '/' + type + '/' + id;
    request.body = JSON.stringify(document);
    request.headers['host'] = domain;
    request.headers['Content-Type'] = 'application/json';
    // Content-Length is only needed for DELETE requests that include a request
    // body, but including it for all requests doesn't seem to hurt anything.
    request.headers['Content-Length'] = Buffer.byteLength(request.body);
  
    var credentials = new AWS.EnvironmentCredentials('AWS');
    var signer = new AWS.Signers.V4(request, 'es');
    signer.addAuthorization(credentials, new Date());
  
    var client = new AWS.HttpClient();
    client.handleRequest(request, null, function(response) {
      console.log(response.statusCode + ' ' + response.statusMessage);
      var responseBody = '';
      response.on('data', function (chunk) {
        responseBody += chunk;
      });
      response.on('end', function (chunk) {
        console.log('Response body: ' + responseBody);
      });
    }, function(error) {
      console.log('Error: ' + error);
    });
  }

exports.handler = async (event, context, callback) => {

    console.log(event);
    let count = 0;

    for (const record of event.Records) {

        let ddbARN = record['eventSourceARN']
        let ddbTable = ddbARN.split(':')[5].split('/')[1]
        console.log("DynamoDB table name: " + ddbTable)
        let id = record.dynamodb.Keys.id.S;
        let idx = ddbTable + "idx";

    

        if (record.eventName == 'REMOVE') {
            console.log('Removed Document' + id);
        }
        else {
            const document = record.dynamodb.NewImage;
            console.log('Adding document');
            console.log(document)
            indexDocument(document);
        }
        count += 1;
    }
    callback(null, `Successfully processed ${count} records.`);




};