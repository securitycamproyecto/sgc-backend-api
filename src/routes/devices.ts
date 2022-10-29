import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Devices from './../modules/devices';
import authMiddleware from "../configs/aws-cognito";

dotenv.config();

class DevicesRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.use(authMiddleware);

        this.express.get("/", async (req, res, next) => {
            try {
                logger.info(`Getting devices`);
                const result = await Devices.getDevices();
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get devices`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.get("/:clientId", async (req, res, next) => {
            const { params } = req;
            if (!params.clientId) { res.status(400).json('Request not contains field "clientId"'); return; }
            try {
                logger.info(`Getting devices`);
                const result = await Devices.getDevicesByClientId(params.clientId);
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get devices`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/", async (req, res, next) => {
            const { body } = req;
            try {
                const uuid = uuidv4();
                logger.info(`Creating new device: ${uuid} - ${JSON.stringify(body)}`);
                await Devices.putDevices(body, uuid, true);
                logger.info(`Device ${uuid} was created`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't create device: ${body.name}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.put("/:id", async (req, res, next) => {
            const { body } = req;
            try {
                logger.info(`Updating device: ${body.id} - ${JSON.stringify(body)}`);
                await Devices.putDevices(body, body.id, false);
                logger.info(`Device ${body.id} was created`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't update device: ${body.name}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/delete/:id", async (req, res, next) => {
            const { body, params } = req;
            if (!params.id) { res.status(400).json('Request not contains field "id"'); return; }
            try {
                logger.info(`Removing device: ${params.id}`);
                await Devices.deleteDevices(params.id, body.services);
                logger.info(`Device ${params.id} was removed`);
                res.status(200).json(params);
            } catch (error: any) {
                const responseMessage = `Can't remove device: ${params.id}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new DevicesRoutes().express;