import { DynamoDB, Rekognition, S3 } from 'aws-sdk';
import { DYNAMO_DB_FACES_TABLE } from './constants';

const insertImageToBucket = async (bucketName: string, key: string, blob: any) => {
    const s3 = new S3();
    return s3.upload({Bucket: bucketName, Key: key, Body: blob, ContentType: 'image/jpeg'}).promise();
}

const processImageInRekognition = async (bucketName: string, collectionId: string, key: string) => {
    const rekognition = new Rekognition();
    return rekognition.indexFaces({CollectionId: collectionId, Image: { S3Object: { Bucket: bucketName, Name: key }}}).promise();
}

const insertImageDetailsToDynamoDB = async (clientId: string, key: string, face: Rekognition.Face, authorized: number) => {
    const dynamodb = new DynamoDB();
    const formatItem: any = {};
    formatItem['id'] = { 'S': face.FaceId };
    formatItem['imageId'] = { 'S': face.ImageId };
    formatItem['externalImageId'] = { 'S': key };
    formatItem['clientId'] = { 'S': clientId };
    formatItem['authorized'] = { 'N': authorized };
    dynamodb.putItem({TableName: DYNAMO_DB_FACES_TABLE, Item: formatItem}).promise();
}

const uploadAndProcessImage = async (bucketName: string, collectionId: string, clientId: string, key: string, blob: any, authorized: number) => {
    await insertImageToBucket(bucketName, key, blob);
    const rekognitionResult = await processImageInRekognition(bucketName, collectionId, key);
    const facesRecords = rekognitionResult.FaceRecords || [];
    if (facesRecords?.length === 0) throw 'Not faces found';
    const face = facesRecords[0].Face || {};
    await insertImageDetailsToDynamoDB(clientId, key, face, authorized);
}

const getImages = async (clientId: string, authorized: string) => {
    const dynamodb = new DynamoDB();
    // const allImages = await s3.listObjects({Bucket: bucketName}).promise();
    const faceRecords = await dynamodb.query({TableName: DYNAMO_DB_FACES_TABLE, KeyConditionExpression: 'clientId = :clientId', ExpressionAttributeValues: { ':clientId': { S: clientId }}}).promise();
    const images: Array<{[key:string]: string}> = [];
    const faceItems = faceRecords.Items || [];
    for (const faceItem of faceItems) {
        if (faceItem.authorized.N != authorized) continue;
        images.push({name: faceItem.externalImageId.S || ''});
    }

    return images;
}

export default {
    uploadAndProcessImage,
    getImages
}