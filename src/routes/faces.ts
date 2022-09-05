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
            if (!req.body.peopleId) { res.status(400).json('Request not contains field "peopleId"'); return; };
            try {
                logger.info(`Getting images: ${req.body.peopleId}`);
                const images = await Faces.getImages(req.body.peopleId);
                logger.info(`${req.body.peopleId} images was getted`);
                res.status(200).json(images);
            } catch (error: any) {
                const responseMessage = `Can't get ${req.body.peopleId} images`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/", upload.single('image'), async (req, res, next) => {
            if (!req.file) { res.status(400).json('Request not contains an image'); return; }
            if (!req.body.peopleId) { res.status(400).json('Request not contains field "peopleId"'); return; }
            if (!req.body.clientId) { res.status(400).json('Request not contains field "clientId"'); return; }
            if (!req.body.collection) { res.status(400).json('Request not contains field "collection"'); return; }
            if (!req.body.bucket) { res.status(400).json('Request not contains field "bucket"'); return; }
            try {
                const uuid = uuidv4();
                logger.info(`Uploading new image: ${uuid} - ${req.file?.originalname}`);
                const buffer = req.file?.buffer;
                await Faces.uploadAndProcessImage(req.body.bucket, req.body.collection, req.body.clientId, uuid, buffer, req.body.peopleId);
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