import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_PEOPLE_TABLE } from './constants';

const getNotificationConfig = async (clientId: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.QueryInput = {
        TableName: DYNAMO_DB_PEOPLE_TABLE, 
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :clientId', 
        ExpressionAttributeValues: { 
            ':clientId': { S: clientId }
        }
    }
    return dynamodb.query(params).promise();
}

export default {
    
}