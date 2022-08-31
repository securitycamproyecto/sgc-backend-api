import express from "express";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import logger from "../logger";
import upload from './middlewares';
import Faces from './../modules/faces';

dotenv.config();

class FacesRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.get("/", async (req, res, next) => {
            if (!req.body.authorized) { res.status(400).json('Request not contains field "authorized"'); return; };
            if (!req.body.clientId) { res.status(400).json('Request not contains field "clientId"'); return; };
            try {
                logger.info(`Getting images: ${req.body.clientId}`);
                const images = await Faces.getImages(req.body.clientId, req.body.authorized);
                logger.info(`${req.body.clientId} images was getted`);
                res.status(200).json(images);
            } catch (error: any) {
                const responseMessage = `Can't get ${req.body.clientId} images`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/", upload.single('image'), async (req, res, next) => {
            if (!req.file) { res.status(400).json('Request not contains an image'); return; }
            if (!req.body.authorized) { res.status(400).json('Request not contains field "authorized"'); return; }
            if (!req.body.clientId) { res.status(400).json('Request not contains field "clientId"'); return; }
            if (!req.body.collection) { res.status(400).json('Request not contains field "collection"'); return; }
            if (!req.body.bucket) { res.status(400).json('Request not contains field "bucket"'); return; }
            try {
                const uuid = uuidv4();
                logger.info(`Uploading new image: ${uuid} - ${req.file?.originalname}`);
                const buffer = req.file?.buffer;
                await Faces.uploadAndProcessImage(req.body.bucket, req.body.collection, req.body.clientId, uuid, buffer, req.body.authorized);
                logger.info(`Image ${uuid} was uploaded`);
                res.status(200).json(`Image ${uuid} was uploaded`);
            } catch (error: any) {
                const responseMessage = `Can't upload image: ${req.file?.originalname}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new FacesRoutes().express;