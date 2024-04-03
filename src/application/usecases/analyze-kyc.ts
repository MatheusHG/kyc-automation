import { extractCPFNumber, extractDateOfBirth, extractName } from "../../utils/mappers";
import { KYCModelUseCase } from "./kyc-model";

export class AnalyzeKYCUseCase {
  public modelUser: ModelUser;
  private modelResponse: ModelAnalysis[];

  public kycUser: KYCData = {} as KYCData;
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
    this.kycUser = JSON.parse(kycUser['Meta']);
    this.alertsUser = [];
    this.modelUser = {} as ModelUser;
    this.modelResponse = [] as ModelAnalysis[];
  }

  async runModel() {
    console.log("\n-=-=-= Lendo o Modelo =-=-=-")
    const kycModelUseCase = new KYCModelUseCase("Extraia todas as informações presentes nas imagens", this.extractImages()); // Extraia apenas o número do cpf da imagem, se existir.
    const result = await kycModelUseCase.execute();
    console.log("\n>> Dados extraidos:\n", result);

    this.modelUser = {
      cpf: extractCPFNumber(result),
      name: extractName(result),
      dateOfBirth: extractDateOfBirth(result)
    }
  }

  async extractWarnings() {
    console.log("-=-=-=-=-=-=-=-=-=-=-=-")
    console.log("\n>> 📚 Analisando documento...");
    const avisos = this.kycUser.ocr.avisos;

    if (avisos) {
      const revalidations = await Promise.all(
        avisos.map(async (aviso: string) => {
          const { alert, filter } = this.extractAlertInfo(aviso);

          if (alert === "Alerta") {
            return {
              case: filter,
              statusBefore: false,
              statusAfter: await this.switchMapper(filter)
            }
          }

          return {
            case: filter,
            statusBefore: true,
            statusAfter: true
          }; // Se não for alerta, não precisa revalidar
        })
      );
      
      return revalidations;
    } else return [] as any;
  }

  private extractAlertInfo(avisos: string) {
    const [alert, message] = avisos.split(" - ");
    const [filter] = message.split(":");
    return { alert, filter };
  }

  async switchMapper(alertMessage: string) {
    console.log(">> Analisando Alerta: ", alertMessage);

    switch(alertMessage) {
      case "CPF não encontrado no documento do cliente / Documento sem CPF":
        return this.validateCPF().then(result => {
          if (result) return true;
          return this.validateName().then(() => this.validateDateOfBirth());
        });
      case "Nome informado pelo cliente é diferente do documento, nome documento":
        return this.validateName().then(result => {
          if (result) return true;
          return this.validateCPF().then(() => this.validateDateOfBirth());
        });
      default:
        return false;
    }
  }

  extractImages() {
    const filesKYC = this.kycUser.ocr.filesId;

    const numbersArray = Object.values(filesKYC);
  
    return numbersArray as number[];
  }

  async validateName() {
    console.log("---- Validando nome...");
    console.log("- Nome extraído: ", this.modelUser.name);
    console.log("- Nome do cliente: ", this.kycUser.cliente.nome);
    if(this.modelUser.name?.toLowerCase() === this.kycUser.cliente.nome.toLowerCase()) {
      console.log(">>> APROVADO NO NOME <<<\n")
      return true; 
    }// identificamos que é igual na documentação
    console.log(">>> REPROVADO NO NOME <<<\n")
    return false;
  }

  async validateDateOfBirth() {
    console.log("---- Validando Data de Nascimento...");
    console.log("- Data de Nascimento extraída: ", this.modelUser.dateOfBirth);
    console.log("- Data de Nascimento do cliente: ", this.kycUser.cliente.data_nascimento);
    if(this.modelUser.dateOfBirth === this.formatDate(this.kycUser.cliente.data_nascimento)) {
    console.log(">>> APROVADO NA DATA DE NASCIMENTO <<<\n")
      return true; 
    }// identificamos que é igual na documentação
    console.log(">>> REPROVADO NA DATA DE NASCIMENTO <<<\n")
    return false;
  }

  async validateCPF() {
    console.log("---- Validando CPF...");
    console.log("- Image(s): ", this.extractImages())
    console.log("- CPF extraído: ", this.modelUser.cpf);
    console.log("- CPF do cliente: ", this.kycUser.cliente.cpf);

    if(this.modelUser.cpf === this.formatNumber(this.kycUser.cliente.cpf)) {
      console.log(">>> APROVADO NO CPF <<<\n")
      return true;
    } // identificamos que é igual na documentação
    console.log(">>> REPROVADO NO CPF <<<\n")
    return false;
  }

  formatNumber(input: any): string {
    if (typeof input !== 'string' && typeof input !== 'number') {
      console.log('O valor de entrada deve ser uma string ou número.');
    }

    const formattedNumber = String(input).replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    return formattedNumber;
  }

  formatDate(inputDate: string): string {
    let dateParts = inputDate.split('-');
    let year = dateParts[0];
    let month = dateParts[1];
    let day = dateParts[2];

    // Verifica se o ano está no formato YY e ajusta para YYYY
    if (year.length === 2) {
        let currentYear = new Date().getFullYear().toString();
        let century = currentYear.substring(0, 2);
        year = century + year;
    }

    return `${day}/${month}/${year}`;
  }

  async execute() {
    return Promise.resolve()
      .then(() => this.runModel())
      .then(() => this.extractWarnings())
      .catch((err) => {
        console.error('Erro ao processar KYC', err);
      });
  }
}

type ComponentMap = {
  [key: string]: string;
};

type ModelUser = {
  cpf: string | null;
  name: string | null;
  dateOfBirth: string | null;
};
interface KYCData {
  status: string;
  cliente: {
    cpf: string;
    nome: string;
    genero: string;
    data_nascimento: string;
    nome_mae: string;
    idade: number;
    signo: string;
    nacionalidade: string;
    outros_campos: {
      situacao: string;
      origem: string;
      uf_cpf: string;
      exclusive_name: string;
    };
    endereco: string;
    endereco_nro: string;
    complemento: string;
    bairro: string;
    estado: string;
    cidade: string;
    cep: string;
  };
  ocr: {
    validated: boolean;
    status: string;
    finish_time: string;
    avisos: string[];
    check: {
      doc_frente: string;
      doc_verso: string;
    };
    log_doc_frente: {
      DocInfo: any;
      EstimatedInfo: any;
      TicketId: string;
      ResultCode: number;
      ResultMessage: string;
    };
    log_doc_verso: {
      DocInfo: any;
      EstimatedInfo: any;
      TicketId: string;
      ResultCode: number;
      ResultMessage: string;
    };
    filesId: {
      'doc-front': number;
      'doc-back': number;
    };
  };
  facematch: {
    validated: boolean;
    status: string;
    finish_time: string;
    avisos: string[];
    similarity: {
      total: number;
      image: string;
      file: number;
    };
    log_selfie: {
      documentFront: any;
      documentBack: any;
    };
    filesId: {
      'doc-front': number;
      'doc-back': number;
      selfie: number;
    };
  };
}

interface ModelAnalysis {
  case: string;
  countSuccess: number;
  countError: number;
}
