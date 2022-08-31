import AWS from 'aws-sdk';

AWS.config.update({region: 'us-east-1'})

/*
AWS.config.getCredentials((err: any) => {
  if (err) console.log(err.stack);

  else {
    console.log("Access key:", AWS.config.credentials?.accessKeyId);
  }
});

const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
dynamodb.createTable({AttributeDefinitions: [{'AttributeName': 'id', 'AttributeType': 'N'}], TableName: 'Prueba', KeySchema: [{'AttributeName': 'id', 'KeyType': 'HASH'}], BillingMode: 'PAY_PER_REQUEST'}, (err: AWS.AWSError, data: AWS.DynamoDB.CreateTableOutput) => {
    console.log(err);
    console.log(data);
})
*/