import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_ANALYSIS_TABLE } from './constants';
import People from './people';

const getRecords = async (clientId: string) => {
    const people = await People.getPeople(clientId);
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
            const person = (people.Items || []).find((x) => x.id.S === item.label.S);
            console.log(person);
            type = person?.authorized.S === '1' ? 'normal' : 'danger';
            names = person?.names.S || '';
            if (matchedFace.length > 0) {
                similarity = matchedFace.Similarity.toString();
            }
        }
        const data = {
            id: item.id.S,
            clientId: item.clientId.S,
            date: item.date.S,
            label: item.label.S,
            matchedFace: matchedFace,
            detectedFace: detectedFace,
            names,
            type,
            similarity
        }
        result.push(data);
    }
    return result;
}

export default {
    getRecords
}