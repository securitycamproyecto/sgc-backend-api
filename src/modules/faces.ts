import { DynamoDB, Rekognition, S3 } from 'aws-sdk';
import { DYNAMO_DB_FACES_TABLE, DYNAMO_DB_PEOPLE_TABLE } from './constants';

const insertImageToBucket = async (bucketName: string, key: string, blob: any) => {
    const s3 = new S3();
    return s3.upload({Bucket: bucketName, Key: key, Body: blob, ContentType: 'image/jpeg'}).promise();
}

const processImageInRekognition = async (bucketName: string, collectionId: string, key: string) => {
    const rekognition = new Rekognition();
    return rekognition.indexFaces({CollectionId: collectionId, Image: { S3Object: { Bucket: bucketName, Name: key }}}).promise();
}

const insertImageDetailsToDynamoDB = async (clientId: string, key: string, face: Rekognition.Face, peopleId: string) => {
    const dynamodb = new DynamoDB();
    const formatItem: any = {};
    formatItem['id'] = { 'S': face.FaceId };
    formatItem['imageId'] = { 'S': face.ImageId };
    formatItem['externalImageId'] = { 'S': key };
    formatItem['clientId'] = { 'S': clientId };
    formatItem['peopleId'] = { 'S': peopleId };
    dynamodb.putItem({TableName: DYNAMO_DB_FACES_TABLE, Item: formatItem}).promise();
}

const uploadAndProcessImage = async (bucketName: string, collectionId: string, clientId: string, key: string, blob: any, peopleId: string) => {
    await insertImageToBucket(bucketName, key, blob);
    const rekognitionResult = await processImageInRekognition(bucketName, collectionId, key);
    const facesRecords = rekognitionResult.FaceRecords || [];
    if (facesRecords?.length === 0) throw 'Not faces found';
    const face = facesRecords[0].Face || {};
    await insertImageDetailsToDynamoDB(clientId, key, face, peopleId);
}

const getImages = async (peopleId: string) => {
    const dynamodb = new DynamoDB();
    // const allImages = await s3.listObjects({Bucket: bucketName}).promise();
    const params = {
        TableName: DYNAMO_DB_FACES_TABLE, 
        KeyConditionExpression: 'peopleId = :peopleId', 
        ExpressionAttributeValues: {
            ':peopleId': { S: peopleId }
        }
    };
    const faceRecords = await dynamodb.query(params).promise();
    const images: Array<{[key:string]: string}> = [];
    const faceItems = faceRecords.Items || [];
    for (const faceItem of faceItems) {
        images.push({name: faceItem.externalImageId.S || ''});
    }

    return images;
}

export default {
    uploadAndProcessImage,
    getImages
}