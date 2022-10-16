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
                await Clients.putClient(body, uuid);
                logger.info(`Client ${uuid} was created`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't create client: ${body.name}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.put("/", async (req, res, next) => {
            const { body } = req;
            try {
                logger.info(`Updating client: ${body.id} - ${JSON.stringify(body)}`);
                await Clients.putClient(body, body.id);
                logger.info(`Client ${body.id} was created`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't update client: ${body.name}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.delete("/:id", async (req, res, next) => {
            const { params } = req;
            if (!params.id) { res.status(400).json('Request not contains field "id"'); return; }
            try {
                logger.info(`Removing client: ${params.id}`);
                await Clients.deleteClient(params.id);
                logger.info(`Client ${params.id} was removed`);
                res.status(200).json(params);
            } catch (error: any) {
                const responseMessage = `Can't remove client: ${params.id}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.get("/:userId", async (req, res, next) => {
            const { params } = req;
            if (!params.userId) { res.status(400).json('Request not contains field "userId"'); return; }
            try {
                logger.info(`Getting client by userId: ${params.userId}`);
                await Clients.getClientByUser(params.userId);
                logger.info(`Client by userId ${params.userId} was getted`);
                res.status(200).json(params);
            } catch (error: any) {
                const responseMessage = `Can't getting client by userId: ${params.userId}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new Identifiers().express;