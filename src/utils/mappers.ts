export function extractCPFNumber(data: string): string | null {
    if (data.includes('CPF:')) {
        const cpfRegex = /\d{3}(\.?\d{3}){2}-?\d{2}/;
        const matches = data.match(cpfRegex);
    
        if (matches && matches.length > 0) {
            return matches[0].replace(/\D/g, '');
        }
    }
    
    return null;
}

export function extractName(data: string): string | null {
    const regex = /\*?\*?Nome:\*?\*?\s*(.+)/;
    const match = data.match(regex);

    if (match && match.length > 1) {
        return match[1].trim(); // Remove espaços em branco extras no início e no final
    }

    return null;
}

export function extractDateOfBirth(data: string): string | null {
    const regex = /\*?\*?(?:Data de )?Nascimento:\*?\*?\s*(.+)/;
    const matches = data.match(regex);

    if (matches && matches.length > 1) {
        return matches[1];
    }

    return null;
}
