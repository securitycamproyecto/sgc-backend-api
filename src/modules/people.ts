import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_PEOPLE_TABLE } from './constants';

const getPeople = async (clientId: string) => {
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

const createPerson = async (newClient: any, uuid: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem: any = {};
    formatItem['id'] = { 'S': uuid };
    formatItem['names'] = { 'S': newClient.names };
    formatItem['age'] = { 'S': newClient.age };
    formatItem['authorized'] = { 'S': newClient.authorized };
    formatItem['clientId'] = { 'S': newClient.clientId };
    return dynamodb.putItem({TableName: DYNAMO_DB_PEOPLE_TABLE, Item: formatItem}).promise();
}

const deletePerson = async (uuid: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: DYNAMO_DB_PEOPLE_TABLE,
        Key: {
          'id': { 'S': uuid }
        }
    };
    return dynamodb.deleteItem(params).promise();
}

export default {
    createPerson,
    deletePerson,
    getPeople
}