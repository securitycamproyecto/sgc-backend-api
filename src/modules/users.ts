import { CognitoIdentityServiceProvider } from 'aws-sdk';

const getUsers = async () => {
    const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
    const users = await cognitoIdentityServiceProvider.listUsers({UserPoolId: 'us-east-1_mexzqUREw'}).promise();
    return users.Users || [];
}

const deleteUser = async (username: string) => {
    const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
    const params: CognitoIdentityServiceProvider.AdminDeleteUserRequest = {
        Username: username,
        UserPoolId: 'us-east-1_mexzqUREw'
    };
    await cognitoIdentityServiceProvider.adminDeleteUser(params).promise();
}

export default {
    getUsers,
    deleteUser
}