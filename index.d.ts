interface UserConfig {
    methods: object;
    beforeMethods: object;
    afterMethods: object;
    onError: (e) => object;
}

declare function jsonRpcRouter (userConfig: UserConfig): (req: object, res: object, next: () => void) => void;

export = jsonRpcRouter;
