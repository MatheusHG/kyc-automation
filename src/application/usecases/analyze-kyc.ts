import { KYCModelUseCase } from "./kyc-model";

export class AnalyzeKYCUseCase {
  public kycUser: any;
  public alertsUser: any[];
  public componentMap: ComponentMap = {
    CPF_NOT_FOUND: "CPF não encontrado no documento do cliente / Documento sem CPF",
    DOCTYPE_DIFFERENT: "Tipo do documento Frente é diferente do documento Verso (DOCTYPE)",
    NAME_DIFFERENT: "Nome informado pelo cliente é diferente do documento, nome documento",
    DATE_OF_BIRTH_DIFFERENT: "Data Nascimento informado pelo cliente é diferente do documento, data nascimento documento",
    NO_VALID_INFORMATION: "Nenhuma informação válida na frente do documento",
    CPF_DIFFERENT: "CPF informado pelo cliente é diferente do documento, CPF documento"
  }

  constructor(kycUser: any) {
    this.kycUser = kycUser;
    this.alertsUser = [];
  }

  private extractAlertInfo(avisos: string) {
    const [alert, message] = avisos.split(" - ");
    const [filter] = message.split(":");
    return { alert, filter };
  }

  async extractWarnings() {
    console.log("-=-=-=-=-=-=-=-=-=-=-=-")
    console.log("\n>> Analisando documento...");
    const meta = JSON.parse(this.kycUser.Meta);
    const avisos = meta?.ocr?.avisos;

    if (avisos) {
      const revalidations = await Promise.all(
        avisos.map(async (aviso: string) => {
          const { alert, filter } = this.extractAlertInfo(aviso);

          if (alert === "Alerta") {
            console.log("Alerta: ", filter);
            return await this.switchMapper(filter);
          }
          return true; // Se não for alerta, não precisa revalidar
        })
      );
      console.log('- tlgd é vdd -', revalidations)
      const isValid = revalidations.every((revalidation) => revalidation);
      return isValid;
    } else return false;
  }

  async switchMapper(alertMessage: string) {
    switch(alertMessage) {
      case "CPF não encontrado no documento do cliente / Documento sem CPF":
        return await this.validateCPF();
      default:
        return false;
    }
  }

  extractImages() {
    const meta = JSON.parse(this.kycUser.Meta);
    const filesKYC = meta?.ocr?.filesId;

    const numbersArray = Object.values(filesKYC);
  
    return numbersArray as string[];
  }

  async validateCPF() {
    console.log("\n>> Validando CPF...");

    const kycModelUseCase = new KYCModelUseCase("Extraia todas as informações presentes na imagem", this.extractImages());
    const result = await kycModelUseCase.execute();

    // valida agora em result a resposta se existe CPF e etc

    console.log(">> CPF: ", result);
    return true;
  }

  async execute() {
    return await this.extractWarnings();
    // Adicione outras chamadas de método de análise, se necessário
  }
}

type ComponentMap = {
  [key: string]: string;
};