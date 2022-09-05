import express from "express";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import logger from "../logger";
import upload from './middlewares';
import Faces from './../modules/faces';
import People from './../modules/people';

dotenv.config();

class PeopleRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.get("/", async (req, res, next) => {
            try {
                logger.info(`Getting people: ${req.query.clientId}`);
                const people = await People.getPeople(req.query.clientId as string);
                res.status(200).json(people);
            } catch (error: any) {
                const responseMessage = `Can't get people`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/", async (req, res, next) => {
            const { body } = req;
            try {
                const uuid = uuidv4();
                logger.info(`Creating new people: ${uuid} - ${JSON.stringify(body)}`);
                await People.createPerson(body, uuid);
                logger.info(`People ${uuid} was created`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't create people: ${body.name}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new PeopleRoutes().express;