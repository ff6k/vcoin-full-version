const AWS = require('aws-sdk');
const short = require('short-uuid');

require('dotenv').config()


AWS.config.update({
    region:process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})



const dynamoClient = new AWS.DynamoDB.DocumentClient()
const TABLE_NAME = "results"

async function getResults  () {
    const params = {
        TableName: TABLE_NAME,
    };
    const results = await dynamoClient.scan(params).promise();
    console.log(results)
    return results;
};

// getResults();

async function getresultByDate (date) {
    const params = {
        TableName: TABLE_NAME,
        IndexName: 'date-index',
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date' : 'date'},
        ExpressionAttributeValues: {
            ":date": date
        }
    };
    console.log(params)
    const results = await dynamoClient.query(params).promise();
    return results;
};


async function  addOrUpdateresult (result) {
    const params = {
        TableName: TABLE_NAME,
        Item: result,
    };
    return await dynamoClient.put(params).promise();
};
