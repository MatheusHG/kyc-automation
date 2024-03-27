import { Request, Response } from 'express';

import HTTPResponse from '../../config/http-response';
import { AnalyzeUserUseCase } from '../usecases/analyze-user';

class AnalyzeUserController implements AnalyzeUserUseCase {
  async handle(request: Request, response: Response): Promise<Response> {

    return new HTTPResponse(response).ok({ message: 'Hello World!' });
  }
}

export default AnalyzeUserController;