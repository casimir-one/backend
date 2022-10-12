# Casimir Off-Chain Server

Casimir Off-chain server is a part of the off-chain cluster. In addition to rendering and storing read models, it also displays them immediately to the end-user. Essentially, the server functions as a proxy between the blockchain and the front-end. A signed user transaction is sent to the server, then to the blockchain. This allows the creation of the correct read model and authentication of the user.

Casimir Off-chain server is blockchain agnostic and can be used with any blockchain. It is available to all portals connected to the Network, which makes it a universal server.

The server is based on Command Query Responsibility Segregation (CQRS), which maximizes its performance, scalability, and security. It is also connected to the file storage system. Therefore, local storage and SMTP server storage can both be used. MongoDB is used to store the read models.

## Local Development

1. See the [repo](https://github.com/casimir-ai/nft-marketplace-template-docker) with docker template configuration. Go through the ["Backend and Frontend development on local environment"](https://github.com/casimir-ai/nft-marketplace-template-docker#backend-and-frontend-development-on-local-environment) section

2. Start the Casimir server in dev mode server using the [local config](https://github.com/casimir-ai/backend/blob/develop/src/config/environment/.local.env):

``` bash
DEIP_CONFIG=local npm run dev
```

3. If you need to work with [Casimir packages](https://github.com/casimir-ai/frontend) that the Casimir server depends on, you can link your local Casimir packages repo by running the following command. This will allow you to develop both [Casimir packages](https://github.com/casimir-ai/frontend) repo and [Casimir server](https://github.com/casimir-ai/backend) repo locally without packages re-publishing.

``` bash
npm run linkModules
```

---


### Environment

* [Command-handlers](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/command-handlers) process [commands](https://github.com/lerna/lerna) that come from the front-end. Command-handler sends the command to the blockchain and writes read models. 
* [Config](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/config) — environment variables required to run the server.  
* Environment [constants](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/constants). 
* [Controllers](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/controllers) — front-end API endpoints. 
* [Dar](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/dar) — supported third-party [texture editor](https://github.com/DEIPworld/texture-editor) for content creation.
* [Database](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/database). MongoDB is used to store read models. 
* [Default](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/default) templates. 
* Server [errors](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/errors).
* [Event-handlers](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/event-handlers) process events after command executing.
* Supported [events](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/events). 
* [Forms](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/forms) — form processors. 
* [Middlewares](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/middlewares) — a set of intermediate steps that request takes before entering the controller. 
* [Schemas](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/schemas) are used to write read models. 
* Subsidiary [scripts](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/scripts). 
* Internal [services](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/services) are used for data handling.
* A file [storage](https://github.com/DEIPworld/deip-offchain-server/tree/develop/src/storage) system. Local storage and SMTP server storage can both be used.



