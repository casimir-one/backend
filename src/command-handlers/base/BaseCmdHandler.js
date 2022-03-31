import EventEmitter from 'events';
import fs from 'fs';
import util from 'util';
import path from 'path';
import assert from 'assert';
import { ChainService } from '@deip/chain-service';
import { APP_PROPOSAL, PROPOSAL_STATUS } from '@deip/constants';
import { CreateProposalCmd, AcceptProposalCmd, DeclineProposalCmd } from '@deip/commands';
import ProposalService from './../../services/impl/write/ProposalService';
import config from './../../config';
import { QUEUE_TOPIC } from './../../constants';
import {
  logError,
  logWarn,
  logCmdInfo
} from '../../utils/log';
import QueueService from "../../queue/QueueService";
import { processManager } from "../../process-manager";


const proposalService = new ProposalService({ scoped: false });
class BaseCmdHandler extends EventEmitter {
  constructor() {
    super();
  }
  registered = [];
  isRegistered(eventNum) {
    return this.registered.includes(eventNum);
  }

  register(cmdNum, handler) {
    assert(!util.types.isAsyncFunction(handler), "Handler must be sync due to concurrency issues that may happen after commands have been applied to blockchain state.");
    this.registered.push(cmdNum);
    this.on(cmdNum, (cmd, ctx) => {
      try {
        logCmdInfo(`Command ${cmd.getCmdName()} is being handled by ${this.constructor.name} ${ctx.state.proposalsStackFrame ? 'within ' + APP_PROPOSAL[ctx.state.proposalsStackFrame.type] + ' flow (' + ctx.state.proposalsStackFrame.proposalId + ')' : ''}`);
        handler(cmd, ctx);
      } catch(err) {
        logError(`Command ${cmd.getCmdName()} ${ctx.state.proposalsStackFrame ? 'within ' + APP_PROPOSAL[ctx.state.proposalsStackFrame.type] + ' flow (' + ctx.state.proposalsStackFrame.proposalId + ')' : ''} failed with an error:`, err);
        throw err;
      }
    });
  }

  async process(msg, ctx,
    validate = async (appCmds, ctx) => {},
    alterOffchainWriteModel = async (appCmds, ctx) => {},
    alterOnchainWriteModel = async (tx, ctx) => {
      const chainService = await ChainService.getInstanceAsync(config);
      const chainRpc = chainService.getChainRpc();
      const chainNodeClient = chainService.getChainNodeClient();
      const verifiedTxPromise = tx.isOnBehalfPortal()
        ? tx.verifyByPortalAsync({ verificationPubKey: config.TENANT_PORTAL.pubKey, verificationPrivKey: config.TENANT_PORTAL.privKey }, chainNodeClient)
        : Promise.resolve(tx.getSignedRawTx());
      const verifiedTx = await verifiedTxPromise;

      const txInfo = await chainRpc.sendTxAsync(verifiedTx);
      await processManager.waitForCommands(msg.appCmds);
      return txInfo;
    },
  ) {

    const { tx, appCmds } = msg;

    await validate(appCmds, ctx);

    if (tx) { // Until we have blockchain-emitted events and a saga we have to validate write model separately
      await alterOnchainWriteModel(tx, ctx);
    } else {
      await alterOffchainWriteModel(appCmds, ctx);
    }

    const { proposalsIds, newProposalsCmds } = this.extractAlteredProposals(appCmds);
    if (proposalsIds.length) { // Until we have blockchain-emitted events and a saga we have to check proposal status manually
      ctx.state.updatedProposals = await this.extractUpdatedProposals({ proposalsIds, newProposalsCmds });
    }

    // The rest code must be synchronous
    BaseCmdHandler.Dispatch(appCmds, ctx);

    const events = ctx.state.appEvents.splice(0, ctx.state.appEvents.length);

    //set events issuer for sending results to the sockets
    for (const event of events) event.setEventIssuer(ctx)

    this.logEvents(events);

    const queueService = await QueueService.getInstanceAsync(config.QUEUE_SERVICE);
    await queueService.sendEvents(QUEUE_TOPIC.APP_EVENT, events);
  };


  handle(cmd, ctx) {
    this.emit(cmd.getCmdNum(), cmd, ctx);
  }


  static Dispatch(cmds, ctx) {
    const CMD_HANDLERS_MAP = require('./../../command-handlers/map');

    for (let i = 0; i < cmds.length; i++) {
      const cmd = cmds[i];
      const cmdHandler = CMD_HANDLERS_MAP[cmd.getCmdNum()];
      if (!cmdHandler) {
        logWarn(`WARNING: No command handler registered for ${cmd.getCmdName()} command`);
        continue;
      }

      if (cmdHandler.isRegistered(cmd.getCmdNum())) {
        cmdHandler.handle(cmd, ctx);
      } else {
        logWarn(`WARNING: No command handler registered for ${cmd.getCmdName()} command in ${cmdHandler.constructor.name}`);
      }
    }
  };


  logEvents(events) {
    const EVENTS_LOG_FILE_PATH = path.join(__dirname, `./../../../${config.TENANT_LOG_DIR}/events.log`);

    let log = '';
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      log += `${event.toString()}\r\n`;
    }
    fs.writeFileSync(EVENTS_LOG_FILE_PATH, log, { flag: 'a' }, (err) => {
      console.error(err);
    });
  }


  extractAlteredProposals(appCmds) {
    const newProposalsCmds = [];
    const proposalCmds = appCmds.filter(cmd => {
      return cmd instanceof CreateProposalCmd;
    });

    for (let i = 0; i < proposalCmds.length; i++) {
      let proposalCmd = proposalCmds[i];
      newProposalsCmds.push(proposalCmd);
      extractNestedProposal(proposalCmd, newProposalsCmds);
    }

    function extractNestedProposal(parentProposalCmd, acc) {
      const nestedProposalCmds = parentProposalCmd.getProposedCmds().filter(cmd => {
        return cmd instanceof CreateProposalCmd;
      });
      for (let i = 0; i < nestedProposalCmds.length; i++) {
        let nestedProposalCmd = nestedProposalCmds[i];
        acc.push(nestedProposalCmd);
        extractNestedProposal(nestedProposalCmd, acc);
      }
    }

    const proposalUpdates = [];
    proposalUpdates.push(...appCmds.filter(cmd => {
      return cmd instanceof AcceptProposalCmd || cmd instanceof DeclineProposalCmd;
    }).map(cmd => ({
      cmd,
      isNewProposal: newProposalsCmds.some(proposalCmd => cmd.getCmdPayload().entityId == proposalCmd.getProtocolEntityId()),
      isAccepted: cmd instanceof AcceptProposalCmd,
      isDeclined: cmd instanceof DeclineProposalCmd
    })));

    for (let i = 0; i < newProposalsCmds.length; i++) {
      let proposalCmd = newProposalsCmds[i];
      proposalUpdates.push(...proposalCmd.getProposedCmds().filter(cmd => {
        return cmd instanceof AcceptProposalCmd || cmd instanceof DeclineProposalCmd;
      }).map(cmd => ({
        cmd,
        isNewProposal: newProposalsCmds.some((proposalCmd) => cmd.getCmdPayload().entityId == proposalCmd.getProtocolEntityId()),
        isAccepted: cmd instanceof AcceptProposalCmd,
        isDeclined: cmd instanceof DeclineProposalCmd
      })));
    }

    const proposalsIds = proposalUpdates.reduce((acc, item) => {
      let { cmd, isNewProposal, isAccepted, isDeclined } = item;
      let { entityId: proposalId } = cmd.getCmdPayload();
      return acc.some(p => p.proposalId === proposalId) ? acc : [...acc, { proposalId, isNewProposal, isAccepted, isDeclined }];
    }, []);

    return { proposalsIds, newProposalsCmds };
  }


  async extractUpdatedProposals({ proposalsIds, newProposalsCmds }) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainProposals = await Promise.all(proposalsIds.map(({ proposalId }) => chainRpc.getProposalAsync(proposalId)));
    const proposals = await proposalService.getProposals(proposalsIds.filter(({ isNewProposal }) => !isNewProposal).map(({ proposalId }) => proposalId));

    const existedProposals = proposalsIds.filter(({ isNewProposal }) => !isNewProposal).map(({ proposalId, isAccepted, isDeclined }) => {
      const proposal = proposals.find(p => p._id === proposalId);
      const proposalCmd = CreateProposalCmd.Deserialize(proposal.cmd);
      const proposedCmds = proposalCmd.getProposedCmds();
      const type = proposalCmd.getProposalType();
      const chainProposal = chainProposals.filter((p) => !!p).find(p => p.proposalId === proposalId);
      const status = chainProposal ? chainProposal.status : isAccepted ? PROPOSAL_STATUS.APPROVED : isDeclined ? PROPOSAL_STATUS.REJECTED : PROPOSAL_STATUS.PENDING;
      return {
        proposalId,
        type,
        status,
        proposalCmd,
        proposedCmds
      }
    })

    const createdProposals = proposalsIds.filter(({ isNewProposal }) => isNewProposal).map(({ proposalId }) => {
      const proposalCmd = newProposalsCmds.find(cmd => cmd.getProtocolEntityId() === proposalId);
      const proposedCmds = proposalCmd.getProposedCmds();
      const type = proposalCmd.getProposalType();
      const status = PROPOSAL_STATUS.PENDING;
      return {
        proposalId,
        type,
        status,
        proposalCmd,
        proposedCmds
      }
    });

    const result = [...existedProposals, ...createdProposals].reduce((map, p) => {
      map[p.proposalId] = p;
      return map;
    }, {});

    return result;
  }


}


module.exports = BaseCmdHandler;
