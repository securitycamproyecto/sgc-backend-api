import express from "express";
import logger from "../logger";

import Clients from "./clients";
import Faces from "./faces";
import People from "./people";
import NotificationsConfig from "./notifications";
import Lambda from "./lambda";
import Analysis from "./analysis";
import Reports from "./reports";
import Support from "./support";
import Users from "./users";
import Devices from "./devices";

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
        this.express.use("/notifications-config", NotificationsConfig);
        this.express.use("/analysis", Analysis);
        this.express.use("/reports", Reports);
        this.express.use("/support", Support)
        this.express.use("/users", Users);
        this.express.use("/devices", Devices);

        this.express.use("/lambda", Lambda);
    }
}

export default new Routes().express;