import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_NOTIFICATIONS_TABLE, DYNAMO_DB_NOTIFICATION_CONFIG_TABLE } from './constants';
import Analysis from './analysis';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

const serviceAccount = require("./../firebase.json");
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

const getNotificationConfigByClient = async (clientId: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.QueryInput = {
        TableName: DYNAMO_DB_NOTIFICATION_CONFIG_TABLE, 
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :clientId', 
        ExpressionAttributeValues: { 
            ':clientId': { S: clientId }
        }
    }
    return dynamodb.query(params).promise();
}

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
        token: { 'S': body.token },
        clientId: { 'S': body.clientId },
    };
    const params: DynamoDB.PutItemInput = {
        TableName: DYNAMO_DB_NOTIFICATION_CONFIG_TABLE,
        Item: formatItem
    }
    return dynamodb.putItem(params).promise();
}

const getNotifications = async (userId: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const params: DynamoDB.QueryInput = {
        TableName: DYNAMO_DB_NOTIFICATIONS_TABLE, 
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId', 
        ExpressionAttributeValues: { 
            ':userId': { S: userId }
        }
    }
    return dynamodb.query(params).promise();
}

const saveNotification = async (uuid: string, userId: string, clientId: string, type: string, body: string, date: string) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem = {
        id: { 'S': uuidv4() },
        userId: { 'S': userId },
        type: { 'S': type },
        body: { 'S': body },
        clientId: { 'S': clientId },
        date: { 'S': date },
        recordId: { 'S': uuid }
    };
    const params: DynamoDB.PutItemInput = {
        TableName: DYNAMO_DB_NOTIFICATIONS_TABLE,
        Item: formatItem
    }
    await dynamodb.putItem(params).promise();
}

const sendNotificationPrueba = async (clientId: string) => {
    // const result = await Analysis.getResult(clientId, );
    const notificationResult = await getNotificationConfigByClient(clientId);
    const tokens = notificationResult.Items?.map((x) => x.token.S || '') || [];
    try {
        const a = await admin.messaging().sendToDevice('ewV4rQSsSRmgnfFtAxsYGl:APA91bGRYa1wLIGM29CJNKOktu8Z6ecgx84hkPH19TwDFlZn8jcRosBWly_OGoH_wEufya64LwStrrjKwKmzL-HPx2wbTBglWZq1HOXtT3wz3P4BTjfNyYfiG9ZdaVuaFHC8OQ96l1RO', {
            notification: {
              title: 'Prueba',
              body: 'Prueba',
            //   clickAction: '51d1187b-d11c-4032-a9a0-7194cdd251b1'
            },
            data: { 
                recordId: '54dd0f76-0103-42bb-b3f3-d057b4d919b8', 
                clientId: '68fdd0e1-7520-4fa4-969c-efe4f7cc31b2',
                title: 'Sat, 24 Sep 2022 02:52:23 GMT' 
            }
        });
        console.log(a.results)
    } catch (err) {
        console.log('err', err);
    }
}

const sendNotification = async (socket: any, uuid: string, clientId: string, matchedFaces: Array<any>, currentFace: string) => {
    // const result = await Analysis.getResult(clientId, );
    const analysisResult = await Analysis.getResult(clientId, matchedFaces, currentFace);
    const notificationResult = await getNotificationConfigByClient(clientId);
    const notificationItems = notificationResult.Items || [];
    for (const config of notificationItems) {
        const token = config.token.S;
        if(!token) continue;
        try {
            let body = `Se identifico a un sujeto desconocido`;
            if (analysisResult.names) body = `Se identifico a ${analysisResult.names} con un ${analysisResult.similarity}% de similitud`
            if (
                (analysisResult.type === 'caution' && config.unknown.S === '1') ||
                (analysisResult.type === 'normal' && config.authorized.S === '1') ||
                (analysisResult.type === 'danger' && config.notAuthorized.S === '1')
            ) {
                const date = (new Date()).toUTCString();
                try {
                    await admin.messaging().sendToDevice(token, {
                        notification: {
                            title: 'Security Cam',
                            body,
                        },
                        data: { recordId: uuid, clientId, title: date}
                    });
                    socket.emit('message', {clientId, body});
                } catch (err) { console.log('Firebase sendToDevice', err); }
                await saveNotification(uuid, config.userId.S as string, clientId, analysisResult.type, body, date);
            }
        } catch (err) {
            console.log(err);
        }
    }
}

export default {
    getNotificationConfig,
    setNotificationConfig,
    sendNotification,
    getNotifications,
    sendNotificationPrueba
}