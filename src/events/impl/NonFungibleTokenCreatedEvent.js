import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class NonFungibleTokenCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      issuer,
      symbol,
      description,
      projectTokenSettings
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!symbol, "'symbol' is required");

    if (projectTokenSettings) { // keep this until we have working F-NFT
      const { projectId, teamId, licenseRevenue } = projectTokenSettings;
      assert(!!projectId, "'projectId' is required for project token");
      assert(!!teamId, "'teamId' is required for project token");

      if (licenseRevenue) {
        const { holdersShare } = licenseRevenue;
        assert(!!holdersShare, "'holdersShare' is required for project 'licenseRevenue' option");
      }
    }

    super(APP_EVENT.NFT_CREATED, eventPayload);
  }

}

module.exports = NonFungibleTokenCreatedEvent;