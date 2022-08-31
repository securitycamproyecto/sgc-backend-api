import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Clients from './../modules/clients';

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
                logger.info(`Getting clients`);
                const result = await Clients.getClient();
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get clients`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/", async (req, res, next) => {
            const { body } = req;
            try {
                const uuid = uuidv4();
                logger.info(`Creating new client: ${uuid} - ${JSON.stringify(body)}`);
                await Clients.createClient(body, uuid);
                logger.info(`Client ${uuid} was created`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't create client: ${body.name}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new Identifiers().express;