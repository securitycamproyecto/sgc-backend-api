import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_NOTIFICATION_CONFIG_TABLE } from './constants';

const getNotificationConfig = async (userId: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.QueryInput = {
        TableName: DYNAMO_DB_NOTIFICATION_CONFIG_TABLE, 
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId', 
        ExpressionAttributeValues: { 
            ':userId': { S: userId }
        }
    }
    return dynamodb.query(params).promise();
}

const setNotificationConfig = async (uuid: string, userId: string, body: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem = {
        id: { 'S': uuid },
        userId: { 'S': userId },
        authorized: { 'S': body.authorized },
        notAuthorized: { 'S': body.notAuthorized },
        unknown: { 'S': body.unknown },
    };
    const params: DynamoDB.PutItemInput = {
        TableName: DYNAMO_DB_NOTIFICATION_CONFIG_TABLE,
        Item: formatItem
    }
    return dynamodb.putItem(params).promise();
}

export default {
    getNotificationConfig,
    setNotificationConfig
}