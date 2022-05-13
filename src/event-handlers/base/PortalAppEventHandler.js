import BaseEventHandler from "./BaseEventHandler";

class PortalAppEventHandler extends BaseEventHandler {
    constructor() {
        super();
    }

    static getHandlers = () => require('../portalApp/map');
}


module.exports = PortalAppEventHandler;