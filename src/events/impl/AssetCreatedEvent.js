import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class AssetCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      issuer,
      symbol,
      precision,
      maxSupply,
      description,
      projectTokenOption
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!symbol, "'symbol' is required");
    assert(Number.isInteger(precision) && precision >= 0, "'precision' must be a positive number");
    assert(!!maxSupply, "'maxSupply' is required");

    if (projectTokenOption) {
      const { projectId, teamId, licenseRevenue } = projectTokenOption;
      assert(!!projectId, "'projectId' is required for project token");
      assert(!!teamId, "'teamId' is required for project token");

      if (licenseRevenue) {
        const { holdersShare } = licenseRevenue;
        assert(!!holdersShare, "'holdersShare' is required for project 'licenseRevenue' option");
      }
    }

    super(APP_EVENT.ASSET_CREATED, eventPayload);
  }

}

module.exports = AssetCreatedEvent;