import csv from "csv-parser";
import { Readable } from "stream";
import { AnalyzeKYCUseCase } from "./analyze-kyc";

export class AnalyzeUserUseCase {
  public sheet: Express.Multer.File;
  public dateNewValidation: ResponseModelValidation[];

  constructor(sheet: Express.Multer.File) {
    this.sheet = sheet;
    this.dateNewValidation = [] as ResponseModelValidation[];
  }

  readSheet() {
    const fileStream = new Readable();
    fileStream.push(Buffer.from(this.sheet.buffer));
    fileStream.push(null);

    fileStream
      .pipe(csv())
      .on("data", (data) => {
        const randomDelay = Math.floor(Math.random() * 20) + 1; // Gera um número aleatório entre 1 e 20
        console.log(
          `Aguardando ${randomDelay} segundos antes de chamar execute novamente...`
        );

        setTimeout(() => {
          const analyzeKYC = new AnalyzeKYCUseCase(data);
          analyzeKYC
            .execute()
            .then((status: ModelAnalysis[]) => {
              // const isValid = revalidations.every((revalidation) => revalidation);
              // falta checar se esse usuário teria sido aprovado de primeira
              
              status.forEach((item) => {
                const index = this.dateNewValidation.findIndex(
                  (validation) => validation.case === item.case
                );

                if (index !== -1) {
                  if (item.statusAfter && !item.statusBefore) {
                    console.log("1 - JÁ EXISTE INCREMENTAAAAA UHULLLL");
                    this.dateNewValidation[index].countEfficient++;
                  } // meu modelo foi eficiente
                  if (!item.statusAfter && !item.statusBefore) {
                    this.dateNewValidation[index].countReprove++;
                  } // manteve o erro
                  if (item.statusAfter && item.statusBefore) {
                    this.dateNewValidation[index].countApprove++;
                  } // continuou aprovado
                } // já existe
                else {
                  if (item.statusAfter && !item.statusBefore) {
                    this.dateNewValidation.push({
                      case: item.case,
                      countEfficient: 1,
                      countApprove: 0,
                      countReprove: 0,
                    });
                  } // meu modelo foi eficiente
                  if (!item.statusAfter && !item.statusBefore) {
                    this.dateNewValidation.push({
                      case: item.case,
                      countEfficient: 0,
                      countApprove: 0,
                      countReprove: 1,
                    });
                  } // manteve o erro
                  if (item.statusAfter && item.statusBefore) {
                    this.dateNewValidation.push({
                      case: item.case,
                      countEfficient: 0,
                      countApprove: 1,
                      countReprove: 0,
                    });
                  } // continuou aprovado
                } // não existe
              });

              console.log("RESULTADO FINAL", this.dateNewValidation);
            })
            .catch((err) => {
              console.log("Erro ao processar KYC", err);
            });
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
