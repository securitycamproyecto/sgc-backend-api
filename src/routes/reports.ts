import express from "express";
import dotenv from 'dotenv';
import logger from "../logger";
import Reports from './../modules/reports';
import authMiddleware from "../configs/aws-cognito";

dotenv.config();

class ReportsRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {
        
        this.express.use(authMiddleware);

        this.express.get("/:clientId/:deviceId/:startDate", async (req, res, next) => {
            if (!req.params.clientId) { res.status(400).json('Request not contains field "clientId"'); return; };
            if (!req.params.deviceId) { res.status(400).json('Request not contains field "deviceId"'); return; };
            if (!req.params.startDate) { res.status(400).json('Request not contains field "startDate"'); return; };
            try {
                logger.info(`Getting report: ${req.params.clientId}`);
                const result = await Reports.getReport(req.params.clientId, req.params.deviceId, req.params.startDate);
                logger.info(`${req.params.clientId} report was getted`);
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get ${req.params.clientId} report`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new ReportsRoutes().express;