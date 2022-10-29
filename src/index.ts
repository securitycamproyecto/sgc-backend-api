import * as bodyParser from "body-parser";
import express from "express";
import dotenv from 'dotenv';

import logger from "./logger";
import Routes from "./routes";
import './configs/config';

dotenv.config();
const port = process.env.PORT;

class App {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
    }

    private middleware(): void {
        this.express.use(bodyParser.json({limit: '100mb'}));
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }

    private routes(): void {

        this.express.get("/", (req, res, next) => {
            res.send("Welcome to SecurityCam Admin Backend");
        });

        this.express.use("/", Routes);

        this.express.listen(port, () => {
          logger.info(`Server is running at https://localhost:${port}`);
        });
    }
}

export default new App().express;