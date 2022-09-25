import { DynamoDB, Rekognition, S3 } from 'aws-sdk';
import { DYNAMO_DB_FACES_TABLE, DYNAMO_DB_PEOPLE_TABLE } from './constants';

const insertImageToBucket = async (bucketName: string, key: string, blob: any) => {
    const s3 = new S3();
    return s3.upload({Bucket: bucketName, Key: key, Body: blob, ContentType: 'image/jpeg'}).promise();
}

const processImageInRekognition = async (bucketName: string, collectionId: string, key: string) => {
    const rekognition = new Rekognition();
    return rekognition.indexFaces({CollectionId: collectionId, Image: { S3Object: { Bucket: bucketName, Name: key }}, DetectionAttributes: ['ALL'], ExternalImageId: key}).promise();
}

const insertImageDetailsToDynamoDB = async (clientId: string, key: string, face: Rekognition.Face, peopleId: string) => {
    const dynamodb = new DynamoDB();
    const formatItem: any = {};
    formatItem['id'] = { 'S': face.FaceId };
    formatItem['imageId'] = { 'S': face.ImageId };
    formatItem['externalImageId'] = { 'S': key };
    formatItem['clientId'] = { 'S': clientId };
    formatItem['peopleId'] = { 'S': peopleId };
    return dynamodb.putItem({TableName: DYNAMO_DB_FACES_TABLE, Item: formatItem}).promise();
}

const uploadAndProcessImage = async (bucketName: string, collectionId: string, clientId: string, key: string, blob: any, peopleId: string) => {
    await insertImageToBucket(bucketName, key, blob);
    console.log(1);
    const rekognitionResult = await processImageInRekognition(bucketName, collectionId, key);
    console.log(2);
    const facesRecords = rekognitionResult.FaceRecords || [];
    console.log(3, facesRecords);
    if (facesRecords.length === 0) throw 'Not faces found';
    const face = facesRecords[0].Face || {};
    console.log(4);
    await insertImageDetailsToDynamoDB(clientId, key, face, peopleId);
    console.log(5);
}

const getImages = async (peopleId: string) => {
    const dynamodb = new DynamoDB();
    // const allImages = await s3.listObjects({Bucket: bucketName}).promise();
    const params = {
        TableName: DYNAMO_DB_FACES_TABLE, 
        IndexName: 'peopleId-index',
        KeyConditionExpression: 'peopleId = :peopleId', 
        ExpressionAttributeValues: {
            ':peopleId': { S: peopleId }
        }
    };
    const faceRecords = await dynamodb.query(params).promise();
    const images: Array<{[key:string]: string}> = [];
    const faceItems = faceRecords.Items || [];
    for (const faceItem of faceItems) {
        images.push({id: faceItem.id.S || '', externalImageId: faceItem.externalImageId.S || ''});
    }

    return images;
}

const getImagesByClientId = async (clientId: string) => {
    const dynamodb = new DynamoDB();
    // const allImages = await s3.listObjects({Bucket: bucketName}).promise();
    const params = {
        TableName: DYNAMO_DB_FACES_TABLE, 
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :clientId', 
        ExpressionAttributeValues: {
            ':clientId': { S: clientId }
        }
    };
    const faceRecords = await dynamodb.query(params).promise();
    const images: Array<{[key:string]: string}> = [];
    const faceItems = faceRecords.Items || [];
    for (const faceItem of faceItems) {
        images.push({id: faceItem.id.S || '', externalImageId: faceItem.externalImageId.S || '', peopleId: faceItem.peopleId.S || ''});
    }

    return images;
}

const deleteFacesFromRekognition = async (collectionId: string, keys: Array<string>) => {
    const rekognition = new Rekognition();
    return rekognition.deleteFaces({CollectionId: collectionId, FaceIds: keys}).promise();
}

const deleteFacesFromBucket = async (bucketName: string, keys: Array<string>) => {
    const s3 = new S3();
    const objects = keys.map((x) => ({Key: x}));
    return s3.deleteObjects({Bucket: bucketName, Delete: {Objects: objects}}).promise();
}

const deleteImagesFromDynamoDB = async (id: string) => {
    const dynamodb = new DynamoDB();
    return dynamodb.deleteItem({TableName: DYNAMO_DB_FACES_TABLE, Key: { id: { S: id }}}).promise();
}

export const deleteFaces = async (bucketName: string, collectionId: string, facesIds: Array<string>, externalFacesIds: Array<string>) => {
    if (facesIds.length > 0)
        await deleteFacesFromRekognition(collectionId, facesIds);
    if (externalFacesIds.length > 0)
        await deleteFacesFromBucket(bucketName, externalFacesIds);
    for (const id of facesIds) {
        await deleteImagesFromDynamoDB(id);
    }
}

export default {
    uploadAndProcessImage,
    getImages,
    getImagesByClientId,
    deleteFaces
}