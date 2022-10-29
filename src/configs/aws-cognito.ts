const CognitoExpress = require("cognito-express");

const cognitoExpress = new CognitoExpress({
	region: "us-east-1",
	cognitoUserPoolId: "us-east-1_mexzqUREw",
	tokenUse: "access",
	tokenExpiration: 3600000
});

const authMiddleware = (req: any, res: any, next: any) => {
	const accessTokenFromClient = req.headers.authorization;
	if (!accessTokenFromClient) return res.status(401).send("Access Token missing from header");
	cognitoExpress.validate(accessTokenFromClient.split(' ')[1], function(err: any, response: any) {
		if (err) return res.status(401).send(err);
		res.locals.user = response;
		next();
	});
};

export default authMiddleware;