import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Support from './../modules/support';

dotenv.config();

class SupportRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.post("/", async (req, res, next) => {
            const { body } = req;
            try {
                const uuid = uuidv4();
                logger.info(`Sending support message: ${req.query.userId}`);
                await Support.setSupportMessage(uuid, req.query.userId as string, body);
                logger.info(`Support ${req.query.userId} was send`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't send support message: ${req.query.userId}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new SupportRoutes().express;