import { CognitoIdentityServiceProvider } from 'aws-sdk';

const getUsers = async () => {
    const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
    const users = await cognitoIdentityServiceProvider.listUsers({UserPoolId: 'us-east-1_mexzqUREw'}).promise();
    return users.Users || [];
}

export default {
    getUsers
}