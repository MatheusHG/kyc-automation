import csv from 'csv-parser';
import { Readable } from 'stream';
import { AnalyzeKYCUseCase } from './analyze-kyc';

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
            .on('data', (data) => {
                return new AnalyzeKYCUseCase(data)
                    .execute()
                    .then((status) => {
                        if(status) {
                            console.log('\n === KYC aprovado com sucesso === \n');
                        } else {
                            console.error('\n === KYC reprovado com sucesso === \n');
                        }
                    })
                    .catch(() => {
                        console.error('Erro ao processar KYC');
                    });
            })
            .on('end', () => {
                console.log('Leitura do CSV concluída');
            });
    }

    async perform() {
        return Promise.resolve()
            .then(() => this.readSheet())
    }
}

export default AnalyzeUserUseCase;