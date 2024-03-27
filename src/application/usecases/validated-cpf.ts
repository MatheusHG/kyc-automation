import { Submission } from "../../domain/entities/submission";

type ValidatedCpfRequest = {
  cpf: string;
}

export class ValidatedCpf {
  execute({ cpf }: ValidatedCpfRequest) {
    const submission = Submission.create({ cpf }, '1' );

    return submission;
  }
}