import BaseEventHandler from "./BaseEventHandler";

class ChainDomainEventHandler extends BaseEventHandler {
    constructor() {
        super();
    }

    static getHandlers = () => require('../chainDomain/map');
}


module.exports = ChainDomainEventHandler;