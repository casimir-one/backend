import { DOMAIN_EVENT } from '@casimir.one/platform-core';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class FTEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const ftEventHandler = new FTEventHandler();

ftEventHandler.register(DOMAIN_EVENT.FT_CLASS_CREATED, async (event) => {
  const { asset_id, creator, owner } = event.getEventPayload();
  console.log("FT_CLASS_CREATED", {asset_id, creator, owner})
});

ftEventHandler.register(DOMAIN_EVENT.FT_ISSUED, async (event) => {
  console.log("FT_ISSUED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_TRANSFERRED, async (event) => {
  console.log("FT_TRANSFERRED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_BURNED, async (event) => {
  console.log("FT_BURNED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_TEAM_CHANGED, async (event) => {
  console.log("FT_TEAM_CHANGED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_OWNER_CHANGED, async (event) => {
  console.log("FT_OWNER_CHANGED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_ACCOUNT_FROZEN, async (event) => {
  console.log("FT_ACCOUNT_FROZEN", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_ACCOUNT_THAWED, async (event) => {
  console.log("FT_CLASS_CREATED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_FROZEN, async (event) => {
  console.log("FT_CLASS_CREATED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_CLASS_DESTROYED, async (event) => {
  console.log("FT_CLASS_DESTROYED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_CLASS_FORCE_CREATED, async (event) => {
  console.log("FT_CLASS_FORCE_CREATED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_METADATA_SET, async (event) => {
  console.log("FT_METADATA_SET", event.getEventPayload());
  const { asset_id, name, symbol, decimals, is_frozen } = event.getEventPayload();
  const nameString = Buffer.from(name).toString('utf8');
  const symbolString = Buffer.from(symbol).toString('utf8');
});

ftEventHandler.register(DOMAIN_EVENT.FT_METADATA_CLEARED, async (event) => {
  console.log("FT_METADATA_CLEARED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_APPROVED_TRANSFER, async (event) => {
  console.log("FT_APPROVED_TRANSFER", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_APPROVAL_CANCELLED, async (event) => {
  console.log("FT_APPROVAL_CANCELLED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_TRANSFERRED_APPROVED, async (event) => {
  console.log("FT_TRANSFERRED_APPROVED", event.getEventPayload())
});

ftEventHandler.register(DOMAIN_EVENT.FT_STATUS_CHANGED, async (event) => {
  console.log("FT_STATUS_CHANGED", event.getEventPayload())
});

module.exports = ftEventHandler;
