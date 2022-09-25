import { DynamoDB, KinesisVideo, KinesisVideoArchivedMedia, S3 } from 'aws-sdk';
import Notifications from './notifications';

const saveOnDynamoDB = async (uuid: string, currentFace: string, clientId: string, informationResult: any) => {
    console.log('===SAVING DYNAMODB===');
    const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
    const formatItem = {
        id: { 'S': uuid },
        label: { 'S': currentFace },
        clientId: { 'S': clientId },
        kinesisVideo: { 'S': JSON.stringify(informationResult.kinesisVideo) },
        detectedFaces: { 'S': JSON.stringify(informationResult.detectedFaces) },
        matchedFaces: { 'S': JSON.stringify(informationResult.matchedFaces) },
        date: {'S': (new Date()).toUTCString() }
    };
    const params = {
        TableName: 'SecurityCam_Analysis',
        Item: formatItem
    }
    dynamodb.putItem(params).promise();
    console.log('===SAVED DYNAMODB===');
};

const saveMediaOnS3 = async (uuid: string, startTimestamp: number, endTimestamp: number) => {
    console.log('===SAVING S3===', uuid, startTimestamp, endTimestamp);
    try {
        const kinesisVideo = new KinesisVideo();
        const dataEndpoint = await kinesisVideo.getDataEndpoint({StreamName: 'MyKVStream', APIName: 'GET_CLIP'}).promise();
        const kinesisVideoArchivedMedia = new KinesisVideoArchivedMedia({endpoint: dataEndpoint.DataEndpoint});
        const clipParams = {
            StreamName: 'MyKVStream',
            ClipFragmentSelector: {
                FragmentSelectorType: 'SERVER_TIMESTAMP',
                TimestampRange: {
                    StartTimestamp: new Date(startTimestamp*1000),
                    EndTimestamp: new Date(endTimestamp*1000)
                }
            }
        }
        const s3 = new S3();
        const clipResult = await kinesisVideoArchivedMedia.getClip(clipParams).promise();
        s3.upload({Bucket: 'myrekognitioncollections', Key: 'clip_' + uuid, Body: clipResult.Payload, ContentType: clipResult.ContentType}).promise();
    } catch (err) {
        console.log(err);
    }
    console.log('===SAVED S3===');
}

const saveMediaOnS3Prueba = async (uuid: string, startTimestamp: number, endTimestamp: number, socket: any) => {
    console.log('===SAVING S3===', uuid, startTimestamp, endTimestamp);
    socket.emit('message', {clientId: '68fdd0e1-7520-4fa4-969c-efe4f7cc31b2', body: 'blablablabla'});
    return;
    try {
        const kinesisVideo = new KinesisVideo();
        kinesisVideo.getDataEndpoint({StreamName: 'MyKVStream', APIName: 'GET_CLIP'}).promise().then((dataEndpoint) => {
            const kinesisVideoArchivedMedia = new KinesisVideoArchivedMedia({endpoint: dataEndpoint.DataEndpoint});
            const clipParams = {
                StreamName: 'MyKVStream',
                ClipFragmentSelector: {
                    FragmentSelectorType: 'SERVER_TIMESTAMP',
                    TimestampRange: {
                        StartTimestamp: new Date(startTimestamp*1000),
                        EndTimestamp: new Date(endTimestamp*1000)
                    }
                }
            }
            // const imagesParams = {
            //     StreamName: 'MyKVStream',
            //     ImageSelectorType: 'SERVER_TIMESTAMP',
            //     StartTimestamp: new Date(startTimestamp*1000),
            //     EndTimestamp: new Date(endTimestamp*1000),
            //     SamplingInterval: 3000,
            //     Format: 'JPEG'
            // }
            const s3 = new S3();
            kinesisVideoArchivedMedia.getClip(clipParams).promise().then((clipResult) => {
                console.log(clipResult);
                // s3.upload({Bucket: 'myrekognitioncollections', Key: 'clip_' + uuid, Body: clipResult.Payload, ContentType: clipResult.ContentType}).promise();
            }).catch((e) => console.log(e));
            // kinesisVideoArchivedMedia.getImages(imagesParams).promise().then((imagesResult) => {
            //     console.log(imagesResult);
            //     // s3.upload({Bucket: 'myrekognitioncollections', Key: 'image_' + uuid, Body: Buffer.from((imagesResult.Images || [])[0].ImageContent || '', 'base64'), ContentEncoding: 'base64', ContentType: 'image/jpeg'}).promise();
            // }).catch((e) => console.log(e));
        });
    } catch (err) {
        console.log(err);
    }
    console.log('===SAVED S3===');
}

const saveResultFromLambda = async (body: any, socket: any) => {
    const startTimestamp = body.informationResult.kinesisVideo[0].ServerTimestamp;
    const endTimestamp = body.informationResult.kinesisVideo[body.informationResult.kinesisVideo.length - 1].ServerTimestamp + 10;
    await saveOnDynamoDB(body.uuid, body.currentFace, body.clientId, body.informationResult);
    await saveMediaOnS3(body.uuid, startTimestamp, endTimestamp);
    Notifications.sendNotification(socket, body.uuid, body.clientId,  body.informationResult.matchedFaces, body.currentFace);
}

export default {
    saveResultFromLambda,
    saveMediaOnS3Prueba
}