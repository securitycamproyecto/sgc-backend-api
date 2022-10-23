import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import Users from './../modules/users';

dotenv.config();

class UsersRoutes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {

        this.express.get("/", async (req, res, next) => {
            try {
                logger.info(`Getting users`);
                const result = await Users.getUsers();
                res.status(200).json(result);
            } catch (error: any) {
                const responseMessage = `Can't get users`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                res.status(500).json(responseMessage);
            }
        });

        this.express.post("/:username", async (req, res, next) => {
            try {
                logger.info(`Delete users`);
                await Users.deleteUser(req.params.username);
                logger.info(`Users was deleted`);
                return res.status(200).send('OK');
            } catch (error: any) {
                const responseMessage = `Can't delete users`;
                logger.error(`${responseMessage} - details: ${error.message}`);
                return res.status(500).json(responseMessage);
            }
        });
    }
}

export default new UsersRoutes().express;