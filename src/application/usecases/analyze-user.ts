export class AnalyzeUserUseCase {
    constructor() {}

    async execute(sheets: string) {
        return sheets + " - Hello World!";
    }
}

export default AnalyzeUserUseCase;