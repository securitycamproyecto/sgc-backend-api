import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_CLIENTS_TABLE } from './constants';

const getClient = async () => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    return dynamodb.scan({ TableName: DYNAMO_DB_CLIENTS_TABLE }).promise();
}

const putClient = async (newClient: any, uuid: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem: any = {};
    formatItem['id'] = { 'S': uuid };
    formatItem['name'] = { 'S': newClient.name };
    formatItem['document'] = { 'S': newClient.document };
    formatItem['phone'] = { 'S': newClient.phone };
    formatItem['users'] = { 'S': JSON.stringify(newClient.users || []) }
    return  dynamodb.putItem({TableName: DYNAMO_DB_CLIENTS_TABLE, Item: formatItem}).promise()
}

const deleteClient = async (uuid: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: DYNAMO_DB_CLIENTS_TABLE,
        Key: {
          'id': { 'S': uuid }
        }
    };
    return dynamodb.deleteItem(params).promise();
}

const getClientByUser = async (userId: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const clientDBResult = await dynamodb.scan({ TableName: DYNAMO_DB_CLIENTS_TABLE }).promise();
    const clients = clientDBResult.Items || [];
    let result = null;
    for (const client of clients) {
        const users = JSON.parse(client.users.S || '[]');
        if (users.some((x: any) => x.id === userId)) {
            console.log()
            result = client.id.S;
            break;
        }
    }
    return result;
}

export default {
    getClient,
    putClient,
    deleteClient,
    getClientByUser
}