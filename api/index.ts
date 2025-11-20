import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Cache the handler to avoid re-registering routes on every request
let handler: any;

export default async (req: any, res: any) => {
    if (!handler) {
        await registerRoutes(app);
        handler = app;
    }
    return handler(req, res);
};
