import express from "express";
import dotenv from 'dotenv';
import logger from "../logger";
import Analysis from './../modules/analysis';

dotenv.config();

class FacesRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.get("/records/:clientId", async (req, res, next) => {
            if (!req.params.clientId) { res.status(400).json('Request not contains field "clientId"'); return; };
            try {
                logger.info(`Getting records: ${req.params.clientId}`);
                const result = await Analysis.getRecords(req.params.clientId);
                logger.info(`${req.params.clientId} records was getted`);
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get ${req.params.clientId} records`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.get("/record/:recordId/:clientId", async (req, res, next) => {
            if (!req.params.recordId) { res.status(400).json('Request not contains field "recordId"'); return; };
            if (!req.params.clientId) { res.status(400).json('Request not contains field "clientId"'); return; };
            try {
                logger.info(`Getting records: ${req.params.clientId}`);
                const result = await Analysis.getRecord(req.params.recordId, req.params.clientId);
                logger.info(`${req.params.clientId} records was getted`);
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get ${req.params.clientId} records`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.delete("/record/:recordId", async (req, res, next) => {
            if (!req.params.recordId) { res.status(400).json('Request not contains field "recordId"'); return; };
            try {
                logger.info(`Deleting records: ${req.params.recordId}`);
                await Analysis.deleteRecord(req.params.recordId);
                logger.info(`${req.params.recordId} records was deleted`);
                res.status(200).send('OK');
            } catch (error: any) {
                const responseMessage = `Can't delete ${req.params.recordId} records`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new FacesRoutes().express;