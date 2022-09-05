import express from "express";
import logger from "../logger";

import Clients from "./clients";
import Faces from "./faces";
import People from "./people";

class Routes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {
        logger.info('Register identifiers routes');
        this.express.use("/clients", Clients);
        this.express.use("/faces", Faces);
        this.express.use("/people", People);
    }
}

export default new Routes().express;