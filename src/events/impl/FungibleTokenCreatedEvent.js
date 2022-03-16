import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class FungibleTokenCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      issuer,
      symbol,
      precision,
      maxSupply,
      description,
      projectTokenSettings
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!symbol, "'symbol' is required");
    assert(Number.isInteger(precision) && precision >= 0, "'precision' must be a positive number");
    assert(!!maxSupply, "'maxSupply' is required");

    if (projectTokenSettings) { // keep this until we have working F-NFT
      const { projectId, teamId, licenseRevenue } = projectTokenSettings;
      assert(!!projectId, "'projectId' is required for project token");
      assert(!!teamId, "'teamId' is required for project token");

      if (licenseRevenue) {
        const { holdersShare } = licenseRevenue;
        assert(!!holdersShare, "'holdersShare' is required for project 'licenseRevenue' option");
      }
    }

    super(APP_EVENT.FT_CREATED, eventPayload);
  }

}

module.exports = FungibleTokenCreatedEvent;