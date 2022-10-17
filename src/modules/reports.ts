import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_ANALYSIS_TABLE } from './constants';
import moment from 'moment';

const getReport = async (clientId: string, deviceId: string, startDate: string) => {
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
        const _deviceId = item.deviceId?.S || 'd1a552e7-27ff-42d3-95e1-a35c97c2c1b8';
        if (_deviceId !== deviceId) continue;
        const date = moment(new Date(item.date.S as string)).format('YYYY-MM-DD');
        if (moment(date).isBefore(moment(startDate))) continue;
        if (!Object.keys(result).some((x: string)=>x===date)) {
            result[date] = 1;
        } else {
            result[date]++;
        }
    }
    console.log(result);
    return result;
}

export default {
    getReport
}