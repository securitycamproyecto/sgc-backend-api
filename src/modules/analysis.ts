import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_ANALYSIS_TABLE } from './constants';
import People from './people';
import Faces from './faces';

const getRecord = async (id: string, clientId: string) => {
    const people = await People.getPeople(clientId);
    const faces = await Faces.getImagesByClientId(clientId);
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.QueryInput = {
        TableName: DYNAMO_DB_ANALYSIS_TABLE, 
        // IndexName: 'clientId-index',
        KeyConditionExpression: 'id = :id', 
        ExpressionAttributeValues: { 
            ':id': { S: id }
        }
    }
    const records = await dynamodb.query(params).promise();
    const recordItems = records.Items || [];
    const result: Array<any> = [];
    for (const item of recordItems) {
        const matchedFace = JSON.parse(item.matchedFaces.S as string)[0];
        const detectedFace = JSON.parse(item.detectedFaces.S as string)[0];
        let names = '';
        let type = 'caution';
        let similarity = '';
        if (item.label.S !== 'unknown') {
            const face = faces.find((x) => x.externalImageId === item.label.S);
            const person = (people.Items || []).find((x) => x.id.S === (face?.peopleId || ''));
            type = person?.authorized.S === '1' ? 'normal' : 'danger';
            names = person?.names.S || '';
            if (matchedFace.length > 0) {
                similarity = matchedFace[0].Similarity.toString();
            }
        }
        const data = {
            id: item.id.S,
            clientId: item.clientId.S,
            date: item.date.S,
            label: item.label.S,
            // matchedFace: matchedFace,
            // detectedFace: detectedFace,
            deviceId: item.deviceId?.S || 'd1a552e7-27ff-42d3-95e1-a35c97c2c1b8',
            names,
            type,
            similarity
        }
        result.push(data);
    }
    return result;
}

const getRecords = async (clientId: string) => {
    const people = await People.getPeople(clientId);
    const faces = await Faces.getImagesByClientId(clientId);
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.QueryInput = {
        TableName: DYNAMO_DB_ANALYSIS_TABLE, 
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :clientId', 
        ExpressionAttributeValues: { 
            ':clientId': { S: clientId }
        }
    }
    const records = await dynamodb.query(params).promise();
    const recordItems = records.Items || [];
    const result: Array<any> = [];
    for (const item of recordItems) {
        const matchedFace = JSON.parse(item.matchedFaces.S as string)[0];
        const detectedFace = JSON.parse(item.detectedFaces.S as string)[0];
        let names = '';
        let type = 'caution';
        let similarity = '';
        if (item.label.S !== 'unknown') {
            const face = faces.find((x) => x.externalImageId === item.label.S);
            const peopleId = (face?.peopleId || '');
            const person = (people.Items || []).find((x) => x.id.S === peopleId);
            type = person?.authorized.S === '1' ? 'normal' : 'danger';
            names = person?.names.S || 'Persona eliminada';
            if (matchedFace.length > 0) {
                similarity = matchedFace[0].Similarity.toString();
            }
        }
        const data = {
            id: item.id.S,
            clientId: item.clientId.S,
            date: item.date.S,
            label: item.label.S,
            // matchedFace: matchedFace,
            // detectedFace: detectedFace,
            deviceId: item.deviceId?.S || 'd1a552e7-27ff-42d3-95e1-a35c97c2c1b8',
            names,
            type,
            similarity
        }
        result.push(data);
    }
    return result;
}

const getResult = async (clientId: string, matchedFaces: Array<any>, currentFace: string) => {
    const people = await People.getPeople(clientId);
    const faces = await Faces.getImagesByClientId(clientId);
    let type: string, names: string = '', similarity: string = '0';
    if (matchedFaces[0].length === 0) type = 'caution';
    else {
        const face = faces.find((x) => x.externalImageId === currentFace);
        const person = (people.Items || []).find((x) => x.id.S === (face?.peopleId || ''));
        type = person?.authorized.S === '1' ? 'normal' : 'danger';
        names = person?.names.S || '';
        similarity = matchedFaces[0][0].Similarity.toString();
    }
    return { type, names, similarity };
}

const deleteRecord = async (id: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.DeleteItemInput = {
        TableName: DYNAMO_DB_ANALYSIS_TABLE, 
        Key: {
          'id': { 'S': id }
        }
    }
    await dynamodb.deleteItem(params).promise();
}

export default {
    getRecord,
    getRecords,
    deleteRecord,
    getResult
}