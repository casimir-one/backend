# DEIP Off-Chain Server

DEIP Off-chain server is a part of the off-chain cluster. In addition to rendering and storing read models, it also displays them immediately to the end-user. Essentially, the server functions as a proxy between the blockchain and the front-end. A signed user transaction is sent to the server, then to the blockchain. This allows the creation of the correct read model and authentication of the user. 

DEIP Off-chain server is blockchain agnostic and can be used with any blockchain. It is available to all portals connected to the DEIP Network, which makes it a universal server.

The server is based on Command Query Responsibility Segregation (CQRS), which maximizes its performance, scalability, and security. It is also connected to the file storage system. Therefore, local storage and SMTP server storage can both be used. MongoDB is used to store the read models.

## Local Development

``` bash

npm run server

```

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



