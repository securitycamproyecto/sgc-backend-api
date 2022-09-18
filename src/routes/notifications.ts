import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Notifications from './../modules/notifications';

dotenv.config();

class Identifiers {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.get("/", async (req, res, next) => {
            try {
                logger.info(`Getting notification config`);
                const result = await Notifications.getNotificationConfig(req.query.userId as string);
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get notifications config`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/", async (req, res, next) => {
            const { body } = req;
            try {
                let uuid: string;
                if (req.query.uuid !== 'null') uuid = req.query.uuid as string;
                else uuid = uuidv4();
                logger.info(`Setting notification config: ${req.query.userId}`);
                await Notifications.setNotificationConfig(uuid, req.query.userId as string, body);
                logger.info(`Notifications ${uuid} was config`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't set notifications config: ${req.query.userId}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new Identifiers().express;