import { Entity } from "../../core/domain/Entity";

type SubmissionProps = {
    // submissionId: string;
    // clientId: string;
    cpf: string;
}

export class Submission extends Entity<SubmissionProps> {
    private constructor(props: SubmissionProps, id: string) {
        super(props, id);
    }

    static create(props: SubmissionProps, id: string): Submission {
        return new Submission(props, id);
    }
}