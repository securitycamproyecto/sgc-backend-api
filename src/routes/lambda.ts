import express from "express";
import dotenv from 'dotenv';
import logger from "../logger";
// import Faces from './../modules/faces';
import Lambda from '../modules/lambda';
import { io, Socket } from "socket.io-client";

dotenv.config();

class LambdaRoutes {

    public express: express.Application;
    public socket: Socket;

    constructor() {
        this.express = express();
        this.socket = io(process.env.WS_SERVER as string);
        this.routes();
    }

    private routes(): void {

        this.express.post("/result", async (req, res, next) => {
            try {
                logger.info(`Saving result from lambda: ${JSON.stringify(req.body)}`);
                Lambda.saveResultFromLambda(req.body, this.socket);
                res.status(200).json(req.body);
            } catch (error: any) {
                const responseMessage = `Can't saved result from lambda`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/result/prueba", async (req, res, next) => {
            try {
                logger.info(`Saving result from lambda: ${JSON.stringify(req.body)}`);
                Lambda.saveMediaOnS3Prueba('1', 1664031121.772, 1664031121.772 + 10, this.socket);//1664031122.772);
                res.status(200).json(req.body);
            } catch (error: any) {
                const responseMessage = `Can't saved result from lambda`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/message", async (req, res, next) => {
            try {
                logger.info(`Sanding message to socket: ${JSON.stringify(req.body)}`);
                const body = `Se indentifico a una persona con el tag: ${req.body.currentFace} - analizando...`
                this.socket.emit('message', {clientId: req.body.clientId, deviceId: req.body.deviceId, body});
                res.status(200).json(req.body);
            } catch (error: any) {
                const responseMessage = `Can't saved result from lambda`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new LambdaRoutes().express;