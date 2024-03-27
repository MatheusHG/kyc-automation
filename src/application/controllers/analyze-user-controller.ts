import { Request, Response } from 'express';

import { container } from 'tsyringe';
import HTTPResponse from '../../config/http-response';
import AnalyzeUserUseCase from '../usecases/analyze-user';

class AnalyzeUserController {
  async handle(request: Request, response: Response): Promise<Response> {

    const getChatUseCase = container.resolve(AnalyzeUserUseCase);

    const element = await getChatUseCase.execute('123');

    return new HTTPResponse(response).ok({ message: element });
  }
}

export default AnalyzeUserController;