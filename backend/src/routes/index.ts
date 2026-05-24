import { Router } from "express";
import { alertController } from "../controllers/alert.controller";
import { healthController } from "../controllers/health.controller";
import { measurementController } from "../controllers/measurement.controller";
import { sensorController } from "../controllers/sensor.controller";
import { statsController } from "../controllers/stats.controller";
import { requireApiKey } from "../middleware/apiKey";

export const apiRouter = Router();

apiRouter.get("/health", healthController.get);

apiRouter.post("/measurements", requireApiKey, measurementController.create);
apiRouter.get("/measurements/latest", measurementController.latest);
apiRouter.get("/measurements", measurementController.list);
apiRouter.delete("/measurements", measurementController.clear);

apiRouter.get("/sensors", sensorController.list);
apiRouter.get("/sensors/:id", sensorController.getById);
apiRouter.patch("/sensors/:id", sensorController.update);
apiRouter.delete("/sensors/:id", sensorController.remove);

apiRouter.get("/stats", statsController.get);

apiRouter.get("/alerts/rules", alertController.listRules);
apiRouter.post("/alerts/rules", alertController.createRule);
apiRouter.patch("/alerts/rules/:id", alertController.updateRule);
apiRouter.get("/alerts/events", alertController.listEvents);
apiRouter.patch("/alerts/events/:id/acknowledge", alertController.acknowledgeEvent);
