import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_ANALYSIS_TABLE } from './constants';
import People from './people';
import moment from 'moment';

const getReport = async (clientId: string, endDate: string) => {
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
    const result: any = { };
    for (const item of recordItems) {
        const date = moment(new Date(item.date.S as string)).format('DD-MM-YYYY');
        if (new Date(date).getTime() > new Date(endDate).getTime()) continue;
        if (!Object.keys(result).some((x: string)=>x===date)) {
            result[date] = 1;
        } else {
            result[date]++;
        }
    }
    return result;
}

export default {
    getReport
}