import csv from "csv-parser";
import { Readable } from "stream";
import { AnalyzeKYCUseCase } from "./analyze-kyc";

export class AnalyzeUserUseCase {
  public sheet: Express.Multer.File;

  constructor(sheet: Express.Multer.File) {
    this.sheet = sheet;
  }

  readSheet() {
    const fileStream = new Readable();
    fileStream.push(Buffer.from(this.sheet.buffer));
    fileStream.push(null);

    fileStream
      .pipe(csv())
      .on("data", (data) => {
        const randomDelay = Math.floor(Math.random() * 4000) + 1; // Gera um número aleatório entre 1 e 20
        console.log(
          `Aguardando ${randomDelay} segundos antes de chamar execute novamente...`
        );

        setTimeout(() => {
          const analyzeKYC = new AnalyzeKYCUseCase(data);
          analyzeKYC.execute();
        }, randomDelay * 1000);
      })
      .on("error", (err) => {
        console.error("Erro ao ler CSV:", err);
      });
  }

  async perform() {
    try {
      const result = await this.readSheet();
      return result;
    } catch (err) {
      console.error("Erro ao executar a análise do usuário:", err);
      throw err;
    }
  }
}

export default AnalyzeUserUseCase;

type ModelAnalysis = {
  case: string;
  statusBefore: boolean;
  statusAfter: boolean;
};

type ModelNewValidation = {
  case: string;
  count: number;
};

type ResponseModelValidation = {
  case: string;
  countEfficient: number; // modelo eficiente
  countApprove: number; // continua aprovado
  countReprove: number; // continua reprovado
};
