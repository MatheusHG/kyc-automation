
import { Router } from 'express';
import multer from 'multer';
import AnalyzeUserController from './application/controllers/analyze-user-controller';

const upload = multer();
const appRouter = Router();

const analyzeUserController = new AnalyzeUserController();
appRouter.post('/analyze', upload.single('csvFile'), analyzeUserController.handle);

export default appRouter;