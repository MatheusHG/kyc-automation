import { Request, Response } from 'express';

import HTTPResponse from '../../config/http-response';
import AnalyzeUserUseCase from '../usecases/analyze-user';

class AnalyzeUserController {
  async handle(req: Request, res: Response): Promise<Response> {
    const csvFile = req.file;

    if (!csvFile) {
      return new HTTPResponse(res).notFound({ message: "Nenhum arquivo enviado" });
    }

    return new AnalyzeUserUseCase(csvFile)
      .perform()
      .then(response => new HTTPResponse(res).ok({ message: "Arquivo CSV processado com sucesso" }))
      .catch(err => new HTTPResponse(res).internalServerError({ message: "Erro ao processar o arquivo CSV" }));
  }
}

export default AnalyzeUserController;