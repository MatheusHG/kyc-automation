import { Entity } from "../../core/domain/Entity";

type ClientProps = {
    name: string;
    cpf: string;
}

export class Client extends Entity<ClientProps> {
    private constructor(props: ClientProps, id: string) {
        super(props, id);
    }

    static create(props: ClientProps, id: string): Client {
        return new Client(props, id);
    }
}