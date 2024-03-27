
import { Router } from 'express';
import AnalyzeUserController from './application/controllers/analyze-user-controller';

const appRouter = Router();

const analyzeUserController = new AnalyzeUserController();
appRouter.get('/analyze', analyzeUserController.handle);

export default appRouter;