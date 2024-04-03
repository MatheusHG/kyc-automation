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
    if (data.includes('Nome:')) {
        const nameRegex = /Nome: (.*)/;
        const matches = data.match(nameRegex);
    
        if (matches && matches.length > 0) {
            return matches[1];
        }
    }
    
    return null;
}

export function extractDateOfBirth(data: string): string | null {
    if (data.includes('Data de Nascimento:')) {
        const dateOfBirthRegex = /Data de Nascimento: (.*)/;
        const matches = data.match(dateOfBirthRegex);
    
        if (matches && matches.length > 0) {
            return matches[1];
        }
    }
    
    return null;
}