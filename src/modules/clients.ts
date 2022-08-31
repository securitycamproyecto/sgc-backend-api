import AWS, { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_CLIENTS_TABLE } from './constants';

const getClient = async () => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    return new Promise((res, rej) => {
        dynamodb.scan({ TableName: DYNAMO_DB_CLIENTS_TABLE }, (err: AWS.AWSError, data: DynamoDB.PutItemOutput) => {
            if (err) rej(err);
            res(data);
        });
    });
}

const createClient = async (newClient: any, uuid: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem: any = {};
    formatItem['id'] = { 'S': uuid };
    formatItem['name'] = { 'S': newClient.name };
    formatItem['contactName'] = { 'S': newClient.contactName };
    formatItem['contactPhone'] = { 'S': newClient.contactPhone };
    return new Promise((res, rej) => {
        dynamodb.putItem({TableName: DYNAMO_DB_CLIENTS_TABLE, Item: formatItem}, (err: AWS.AWSError, data: DynamoDB.PutItemOutput) => {
            if (err) rej(err);
            res(data);
        });
    });
}

export default {
    createClient,
    getClient
}