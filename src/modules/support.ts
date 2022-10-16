import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_SUPPORT_TABLE } from './constants';

const setSupportMessage = async (uuid: string, userId: string, body: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem = {
        id: { 'S': uuid },
        userId: { 'S': userId },
        body: { 'S': body.body },
        clientId: { 'S': body.clientId },
        date: {'S': (new Date()).toUTCString() }
    };
    const params: DynamoDB.PutItemInput = {
        TableName: DYNAMO_DB_SUPPORT_TABLE,
        Item: formatItem
    }
    return dynamodb.putItem(params).promise();
}

export default {
    setSupportMessage
}