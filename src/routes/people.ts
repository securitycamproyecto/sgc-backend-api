import express from "express";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import logger from "../logger";
import People from './../modules/people';
import authMiddleware from "../configs/aws-cognito";

dotenv.config();

class PeopleRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {
        
        this.express.use(authMiddleware);

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
                let uuid: string;
                if (req.query.uuid !== 'null') uuid = req.query.uuid as string;
                else uuid = uuidv4();
                logger.info(`Creating new people: ${uuid} - ${JSON.stringify(body)}`);
                await People.putPerson(body, uuid);
                body.uuid = uuid;
                logger.info(`People ${uuid} was created`);
                res.status(200).json(body);
            } catch (error: any) {
                const responseMessage = `Can't create people: ${body.name}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.delete("/:id", async (req, res, next) => {
            const { params } = req;
            if (!params.id) { res.status(400).json('Request not contains field "id"'); return; }
            try {
                logger.info(`Removing people: ${params.id}`);
                await People.deletePerson(params.id);
                logger.info(`People ${params.id} was removed`);
                res.status(200).json(params);
            } catch (error: any) {
                const responseMessage = `Can't remove people: ${params.id}`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });
    }
}

export default new PeopleRoutes().express;