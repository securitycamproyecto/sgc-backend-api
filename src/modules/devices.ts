import { DynamoDB, KinesisVideo, Kinesis, Rekognition, Lambda } from 'aws-sdk';
import { DYNAMO_DB_DEVICES_TABLE } from './constants';
import JSZip from 'jszip';

const zip = new JSZip();
const delay = (ms: number) => {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const getDevices = async () => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.ScanInput = { TableName: DYNAMO_DB_DEVICES_TABLE }
    return dynamodb.scan(params).promise();
}

const getDevicesByClientId = async (clientId: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.QueryInput = {
        TableName: DYNAMO_DB_DEVICES_TABLE, 
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :clientId', 
        ExpressionAttributeValues: { 
            ':clientId': { S: clientId }
        }
    }
    return dynamodb.query(params).promise();
}

const putDevices = async (newDevice: any, uuid: any, createServices: boolean) => {
    const services = newDevice.services || {};
    if (createServices) {
        const kinesisVideo = new KinesisVideo();
        const kinesisVideoStream = await kinesisVideo.createStream({StreamName: uuid, DataRetentionInHours: 24}).promise();
        services.KinesisVideoStream = { name: uuid, arn: kinesisVideoStream.StreamARN }

        const kinesis = new Kinesis();
        await kinesis.createStream({StreamName: uuid}).promise();
        services.KinesisDataStream = { name: uuid, arn: `arn:aws:kinesis:us-east-1:139296681394:stream/${uuid}` }

        const rekognition = new Rekognition();
        const streamProcessor = await rekognition.createStreamProcessor({
            Name: uuid, 
            Input: { KinesisVideoStream: { Arn: services.KinesisVideoStream.arn } }, 
            Output: { KinesisDataStream: { Arn: services.KinesisDataStream.arn } },
            RoleArn: 'arn:aws:iam::139296681394:role/Rekognition',
            Settings: { FaceSearch: {CollectionId: 'MyCollection', FaceMatchThreshold: 50.0}}
        }).promise();
        services.StreamProcessor = { name: uuid, arn: streamProcessor.StreamProcessorArn }
        await rekognition.startStreamProcessor({Name: services.StreamProcessor.name}).promise();

        const lambda = new Lambda();
        const blobFunction = await zip.file('index.zip', functionTemplate(uuid, newDevice.clientId)).generateAsync({type:"arraybuffer"});
        await lambda.createFunction({
            Code: { ZipFile: blobFunction },
            FunctionName: uuid,
            Handler: 'index.handler',
            Runtime: 'nodejs12.x',
            Role: 'arn:aws:iam::139296681394:role/lambda_kinesis'
        }).promise();
        services.Lambda = { name: uuid }
        await delay(10000);
        await lambda.createEventSourceMapping({
            FunctionName: uuid, 
            EventSourceArn: `arn:aws:kinesis:us-east-1:139296681394:stream/${uuid}`,
            BatchSize: 100,
            StartingPosition: 'LATEST',
        }).promise();
    }
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem: any = {};
    formatItem['id'] = { 'S': uuid };
    formatItem['clientId'] = { 'S': newDevice.clientId };
    formatItem['location'] = { 'S': newDevice.location };
    formatItem['model'] = { 'S': newDevice.model };
    formatItem['name'] = { 'S': newDevice.name };
    formatItem['serie'] = { 'S': newDevice.serie };
    formatItem['services'] = { 'S': JSON.stringify(services) }
    return  dynamodb.putItem({TableName: DYNAMO_DB_DEVICES_TABLE, Item: formatItem}).promise()
}

const deleteDevices = async (uuid: any, services: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const kinesisVideo = new KinesisVideo();
    const kinesis = new Kinesis();
    const rekognition = new Rekognition();
    const lambda = new Lambda();
    var params = {
        TableName: DYNAMO_DB_DEVICES_TABLE,
        Key: {
          'id': { 'S': uuid }
        }
    };
    await dynamodb.deleteItem(params).promise();
    await lambda.deleteFunction({FunctionName: uuid}).promise();
    await rekognition.stopStreamProcessor({Name: uuid}).promise();
    await rekognition.deleteStreamProcessor({Name: uuid}).promise();
    await kinesis.deleteStream({StreamName: uuid}).promise();
    await kinesisVideo.deleteStream({StreamARN: services.KinesisVideoStream.arn}).promise();
}

const functionTemplate = (uuid: string, clientId: string) => {
    return `
        const { v4 } = require('uuid');
        const axios = require('axios');
        const url = "https://www.securitycamperu.com"

        console.log('Loading function');
        const clientId = '${clientId}';
        const deviceId = '${uuid}';
        let currentFace = '';
        let informationResult = {
            kinesisVideo: [],
            detectedFaces: [],
            matchedFaces: []
        };

        exports.handler = function(event, context) {
            event.Records.forEach(function(record) {
                console.log('INIT PROCESS');
                const payload = Buffer.from(record.kinesis.data, 'base64').toString('ascii');
                if (!payload) return;
                const data = JSON.parse(payload);
                if (data.FaceSearchResponse.length === 0 || informationResult.kinesisVideo.length === 30) {
                    if (informationResult.detectedFaces.length > 0) {
                        ///////////////////////////////////
                        const uuid = v4();
                        axios.post(url + '/lambda/message', {clientId, deviceId, currentFace});
                        axios.post(url + '/lambda/result', {uuid, currentFace, clientId, deviceId, informationResult});
                        ///////////////////////////////////
                    }
                    currentFace = '';
                    informationResult = {
                        kinesisVideo: [],
                        detectedFaces: [],
                        matchedFaces: []
                    };
                    return;
                }
                for (const faceData of data.FaceSearchResponse) {
                    let externalImageId = 'unknown';
                    if (faceData.MatchedFaces.length > 0) externalImageId = faceData.MatchedFaces[0].Face.ExternalImageId;
                    if (currentFace !== externalImageId) {
                        ///////////////////////////////////
                        /*
                        Enviar notificacion
                        */
                        ///////////////////////////////////
                        if (currentFace !== '') {
                            const uuid = v4();
                            axios.post(url + '/lambda/message', {clientId, deviceId, currentFace});
                            axios.post(url + '/lambda/result', {uuid, currentFace, clientId, deviceId, informationResult});
                        }
                        ///////////////////////////////////
                        currentFace = externalImageId;
                        informationResult = {
                            kinesisVideo: [data.InputInformation.KinesisVideo],
                            detectedFaces: [faceData.DetectedFace],
                            matchedFaces: [faceData.MatchedFaces]
                        };
                    } else {
                        informationResult.kinesisVideo.push(data.InputInformation.KinesisVideo);
                        informationResult.detectedFaces.push(faceData.DetectedFace);
                        if (faceData.MatchedFaces.length > 0)
                        informationResult.matchedFaces.push(faceData.MatchedFaces);
                    }
                }
                console.log('currentFace:', currentFace);
                console.log('data:', data);
                console.log('END PROCESS');
            });
        };
    `
}

export default {
    getDevices,
    getDevicesByClientId,
    putDevices,
    deleteDevices
}