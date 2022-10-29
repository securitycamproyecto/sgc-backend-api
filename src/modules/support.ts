import { DynamoDB } from 'aws-sdk';
import { DYNAMO_DB_SUPPORT_TABLE } from './constants';
import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_NUMBER;
const supportPhoneNumber = process.env.SUPPORT_PHONE_NUMBER;
const client = Twilio(accountSid, authToken);

const setSupportMessage = async (uuid: string, userId: string, body: any) => {
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem = {
        id: { 'S': uuid },
        userId: { 'S': userId },
        username: { 'S': body.username },
        body: { 'S': body.body },
        clientId: { 'S': body.clientId },
        date: {'S': (new Date()).toUTCString() }
    };
    const params: DynamoDB.PutItemInput = {
        TableName: DYNAMO_DB_SUPPORT_TABLE,
        Item: formatItem
    }
    await dynamodb.putItem(params).promise();
    const message = `*SecurityCam Support*: Ha recibido un mensaje del usuario *${body.username}*\n*Mensaje*: ${body.body}`;
    client.messages.create({
         from: `whatsapp:${phoneNumber}`,
         body: message,
         to: `whatsapp:${supportPhoneNumber}`
    }).then(message => console.log(message.sid)).catch(err => console.log(err));
}

export default {
    setSupportMessage
}