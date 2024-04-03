import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

export class KYCModelUseCase {
  public prompt: string;
  public filesImgs: number[];

  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(public message: string, public codeImg: number[]) {
    this.prompt = message;
    this.filesImgs = codeImg;

    this.genAI = new GoogleGenerativeAI("AIzaSyCdA8vWIdYgtkf22mKZwcZSs-qjLNgEqbE");
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  }

  private bufferImage() {
    const imagesBuffer = this.filesImgs.map(img => {
      const path = `/Users/matheushenrique/Documents/marjosports/script_image/src/controllers/Dezembro/${img}.jpg`;
      if (fs.existsSync(path)) {
        const data = fs.readFileSync(path).toString('base64');
        return {
          inlineData: {
            data,
            mimeType: 'image/png',
          },
        };
      } else {
        return null;
      }
    });

    return imagesBuffer.filter(item => item !== null);
  }

  async execute() {
    const imagesBuffer = this.bufferImage();
    const result = await this.model.generateContent([this.prompt, ...imagesBuffer]);
    const response = await result.response;
    return response.text();
  }
}
