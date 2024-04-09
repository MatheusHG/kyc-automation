import mongoose from "../database";

const userKYCSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['Análise Manual', 'Aprovado', 'Reprovado'],
        required: true
    },
    cpf: {
        type: String,
        required: true
    },
    nome: {
        type: String,
    },
    data_de_nascimento: {
        type: String,
    },
    estado: {
        type: String,
    },
    cidade: {
        type: String,
    },
    genero: {
        type: String,
    },
    filesId: {
        doc_front: Number,
        doc_back: Number,
        selfie: Number
    },
    log_kyc_received: {
        birthdate: String,
        doctype: String,
        mothername: String,
        name: String,
        cpf: String
    },
    log_kyc_analyzed: {
        birthdate: String,
        mothername: String,
        name: String,
        cpf: String
    },
    results: [{
        case: {
            type: String,
            required: true
        },
        statusBefore: {
            type: Boolean,
            required: true
        },
        statusAfter: {
            type: Boolean,
            required: true
        }
    }],
    created_at: {
        type: Date,
        required: true
    },
    analyzed_at: {
        type: Date,
        default: Date.now,
    }
});

const UserKYC = mongoose.model('UserKYC', userKYCSchema);

export default UserKYC;
