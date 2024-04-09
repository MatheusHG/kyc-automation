import UserKYCResults from "../../models/user-kyc";
import {
  extractCPFNumber,
  extractDateOfBirth,
  extractName,
} from "../../utils/mappers";
import { KYCModelUseCase } from "./kyc-model";

export class AnalyzeKYCUseCase {
  public modelUser: ModelUser;
  public statusEnd: string;
  public kycUser: KYCData = {} as KYCData;
  public alertsUser: any[];
  public componentMap: ComponentMap = {
    CPF_NOT_FOUND:
      "CPF não encontrado no documento do cliente / Documento sem CPF",
    DOCTYPE_DIFFERENT:
      "Tipo do documento Frente é diferente do documento Verso (DOCTYPE)",
    NAME_DIFFERENT:
      "Nome informado pelo cliente é diferente do documento, nome documento",
    DATE_OF_BIRTH_DIFFERENT:
      "Data Nascimento informado pelo cliente é diferente do documento, data nascimento documento",
    NO_VALID_INFORMATION: "Nenhuma informação válida na frente do documento",
    CPF_DIFFERENT:
      "CPF informado pelo cliente é diferente do documento, CPF documento",
  };

  constructor(kycUser: any) {
    this.kycUser = JSON.parse(kycUser["Meta"]);
    this.alertsUser = [];
    this.modelUser = {} as ModelUser;
    this.statusEnd = "Análise Manual";
  }

  async runModel() {
    // console.log("\n-=-=-= Lendo o Modelo =-=-=-");
    const kycModelUseCase = new KYCModelUseCase(
      "Extraia todas as informações presentes nas imagens",
      this.extractImages()
    ); // Extraia apenas o número do cpf da imagem, se existir.
    const result = await kycModelUseCase.execute();
    // console.log("\n>> Dados extraidos:\n", result);

    this.modelUser = {
      cpf: extractCPFNumber(result),
      name: extractName(result),
      dateOfBirth: extractDateOfBirth(result),
    };
  }

  async extractWarnings() {
    // console.log("-=-=-=-=-=-=-=-=-=-=-=-");
    // console.log("\n>> 📚 Analisando documento...");
    const avisos = this.kycUser.ocr.avisos;

    if (avisos) {
      this.alertsUser = await Promise.all(
        avisos.map(async (aviso: string) => {
          const { alert, filter } = this.extractAlertInfo(aviso);

          if (alert === "Alerta") {
            const result = await this.switchMapper(filter);
            if (result && this.statusEnd === "Análise Manual")
              this.statusEnd = "Aprovado";
            else if (!result && this.statusEnd === "Análise Manual")
              this.statusEnd = "Reprovado";

            return {
              case: filter,
              statusBefore: false,
              statusAfter: result,
            };
          }

          return {
            case: filter,
            statusBefore: true,
            statusAfter: true,
          }; // Se não for alerta, não precisa revalidar
        })
      );

      return this.alertsUser;
    } else return [] as any;
  }

  private extractAlertInfo(avisos: string) {
    const [alert, message] = avisos.split(" - ");
    const [filter] = message.split(":");
    return { alert, filter };
  }

  async switchMapper(alertMessage: string) {
    // console.log(">> Analisando Alerta: ", alertMessage);

    switch (alertMessage) {
      case "CPF não encontrado no documento do cliente / Documento sem CPF":
        return this.validateCPF().then((result) => {
          if (result) return true;
          return this.validateName().then(() => this.validateDateOfBirth());
        });
      case "CPF informado pelo cliente é diferente do documento, CPF documento":
        return this.validateCPF().then((result) => {
          if (result) return true;
          return this.validateName().then(() => this.validateDateOfBirth());
        });
      case "Nome informado pelo cliente é diferente do documento, nome documento":
        return this.validateName().then((result) => {
          if (result) return true;
          return this.validateCPF().then(() => this.validateDateOfBirth());
        });
      case "Data Nascimento informado pelo cliente é diferente do documento, data nascimento documento":
        return this.validateDateOfBirth().then((result) => {
          if (result) return true;
          return this.validateName().then(() => this.validateCPF());
        });
      case "Nenhuma informação válida na frente do documento":
        return this.validateName()
          .then(() => this.validateCPF())
          .then(() => this.validateDateOfBirth());
      case "Tipo do documento Frente é diferente do documento Verso (DOCTYPE)":
        return this.validateName()
          .then(() => this.validateCPF())
          .then(() => this.validateDateOfBirth());
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
    const modelName = this.modelUser.name;
    const clientName = this.kycUser.cliente.nome;

    if (modelName === null || clientName === null) return false;

    if (modelName.toLowerCase() === clientName.toLowerCase()) {
      return true;
    }

    const modelParts = modelName.trim().split(" ");
    const clientParts = clientName.trim().split(" ");

    if (modelParts.length + 1 === clientParts.length) {
      const modelLastName = modelParts[modelParts.length - 1].toLowerCase();
      const clientLastName = clientParts[clientParts.length - 1].toLowerCase();
      if (!clientLastName.includes(modelLastName)) {
        return true;
      }
    }

    // if(this.kycUser.cliente.nome === 
    //   (this.kycUser.ocr.log_doc_frente.DocInfo?.NAME || this.kycUser.cliente.nome === this.kycUser.ocr.log_doc_verso.DocInfo?.NAME)) {
    //     return true;
    //   }

    return false;
  }

  async validateDateOfBirth() {
    if (
      this.modelUser.dateOfBirth ===
      this.formatDate(this.kycUser.cliente.data_nascimento)
    ) {
      return true;
    }

    // if(this.formatDate(this.kycUser.cliente.data_nascimento) === 
    //   (this.formatDate(this.kycUser.ocr.log_doc_frente.DocInfo?.BIRTHDATE) || this.formatDate(this.kycUser.ocr.log_doc_verso.DocInfo?.BIRTHDATE))) {
    //     return true;
    //   }

    return false;
  }

  async validateCPF() {
    if (this.modelUser.cpf === this.formatNumber(this.kycUser.cliente.cpf)) {
      return true;
    }

    // if(this.kycUser.cliente.cpf === 
    //   (this.kycUser.ocr.log_doc_frente.DocInfo?.CPF) || this.kycUser.ocr.log_doc_verso.DocInfo?.CPF) {
    //     return true;
    //   }

    return false;
  }

  formatNumber(input: any): string {
    if (typeof input !== "string" && typeof input !== "number") {
      console.log("O valor de entrada deve ser uma string ou número.");
    }

    const formattedNumber = String(input).replace(/\D/g, ""); // Remove todos os caracteres não numéricos
    return formattedNumber;
  }

  formatDate(date: string): string {
    if (!date) {
      return '';
    }

    const replaceSimbols = date.replace(/[\/-]/g, " ");
    let day = replaceSimbols.split(" ")[0];
    let monthName = replaceSimbols.split(" ")[1];
    let year = replaceSimbols.split(" ")[2];
    
    if(day.length === 4) {
      year = day;
      day = replaceSimbols.split(" ")[2];
    }

    if (year.length === 2) {
      let currentYear = new Date().getFullYear().toString();
      let century = currentYear.substring(0, 2);
      year = century + year;
    }

    const monthsMap: MonthsMap = {
      JAN: "01",
      FEV: "02",
      MAR: "03",
      ABR: "04",
      MAI: "05",
      JUN: "06",
      JUL: "07",
      AGO: "08",
      SET: "09",
      OUT: "10",
      NOV: "11",
      DEZ: "12",
    };

    const month = monthsMap[monthName] || monthName;

    return `${day}/${month}/${year}`;
  }

  async savingResults() {
    // Salvar os resultados no banco
    const data = {
      status: this.statusEnd,
      cpf: this.kycUser.cliente.cpf,
      nome: this.kycUser.cliente.nome,
      genero: this.kycUser.cliente.genero,
      data_de_nascimento: this.kycUser.cliente.data_nascimento,
      estado: this.kycUser.cliente.estado,
      cidade: this.kycUser.cliente.cidade,
      filesId: this.kycUser.ocr.filesId,
      log_kyc_received: {
        birthdate:
          this.kycUser.ocr.log_doc_frente.DocInfo.BIRTHDATE ||
          this.kycUser.ocr.log_doc_verso.DocInfo.BIRTHDATE,
        doctype:
          this.kycUser.ocr.log_doc_frente.DocInfo.DOCTYPE ||
          this.kycUser.ocr.log_doc_verso.DocInfo.DOCTYPE,
        mothername:
          this.kycUser.ocr.log_doc_frente.DocInfo.MOTHERNAME ||
          this.kycUser.ocr.log_doc_verso.DocInfo.MOTHERNAME,
        name:
          this.kycUser.ocr.log_doc_frente.DocInfo.NAME ||
          this.kycUser.ocr.log_doc_verso.DocInfo.NAME,
        cpf:
          this.kycUser.ocr.log_doc_frente.DocInfo.CPF ||
          this.kycUser.ocr.log_doc_verso.DocInfo.CPF,
      },
      log_kyc_analyzed: {
        birthdate: this.modelUser.dateOfBirth,
        // mothername: this.kycUser.cliente.nome_mae,
        name: this.modelUser.name,
        cpf: this.modelUser.cpf,
      },
      results: this.alertsUser,
      created_at: new Date(this.kycUser.ocr.finish_time)
    };

    const response = await UserKYCResults.findOne({ cpf: data.cpf });

    if (response) {
      if ((response.status === "Análise Manual" || response.status === "Reprovado") && data.status === "Aprovado") {
        await UserKYCResults.updateOne(
          { cpf: data.cpf },
          {
            $set: {
              status: data.status,
              results: data.results,
              log_kyc_analyzed: data.log_kyc_analyzed,
            },
          }
        );
      }
    } else {
      await UserKYCResults.create(data);
    }
  }

  async execute() {
    return Promise.resolve()
      .then(() => this.runModel())
      .then(() => this.extractWarnings())
      .then(() => this.savingResults())
      .then(() => {
        console.log(">>> Finalizado ", {
          status: this.statusEnd,
          cpf: this.kycUser.cliente.cpf
        });
      })
      .catch(async (err) => {
        try {
          console.log("ERROR MENSAGEM -> ", err.message)
          const response = await UserKYCResults.findOne({ cpf: this.kycUser.cliente.cpf, status: 'Aprovado' });
          if (!response && err.message === '[GoogleGenerativeAI Error]: Candidate was blocked due to SAFETY') {
            this.statusEnd = "Análise Manual";
            this.savingResults();
            console.log(`Erro ao validar ${this.kycUser.cliente.cpf}. Status: Análise Manual`);
          } else {
            console.log(`${this.kycUser.cliente.cpf} ERROR -> ${err.message}. Já aprovado na base, mantém aprovado, ou OCR sem documento.`);
          }
        } catch (error) {
          console.error("Erro ao buscar registro:", err.message);
        }
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
      "doc-front": number;
      "doc-back": number;
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
      "doc-front": number;
      "doc-back": number;
      selfie: number;
    };
  };
}

interface MonthsMap {
  [key: string]: string;
  JAN: string;
  FEV: string;
  MAR: string;
  ABR: string;
  MAI: string;
  JUN: string;
  JUL: string;
  AGO: string;
  SET: string;
  OUT: string;
  NOV: string;
  DEZ: string;
}