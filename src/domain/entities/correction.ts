import { Entity } from "../../core/domain/Entity";

type CorrectionProps = {
    // tudo que tem dentro do JSON
    submissionId: string;
}

export class Correction extends Entity<CorrectionProps> {
    private constructor(props: CorrectionProps, id: string) {
        super(props, id);
    }

    static create(props: CorrectionProps, id: string): Correction {
        return new Correction(props, id);
    }
}