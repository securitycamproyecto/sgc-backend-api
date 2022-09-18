import express from "express";
import dotenv from 'dotenv';
import logger from "../logger";
// import Faces from './../modules/faces';
import Lambda from '../modules/lambda';

dotenv.config();

class PeopleRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.post("/result", async (req, res, next) => {
            try {
                logger.info(`Saving result from lambda: ${JSON.stringify(req.body)}`);
                Lambda.saveResultFromLambda(req.body);
                res.status(200).json(req.body);
            } catch (error: any) {
                const responseMessage = `Can't saved result from lambda`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new PeopleRoutes().express;