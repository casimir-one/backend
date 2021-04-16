import assert from 'assert';
import { APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';
import ProposalEvent from './proposalEvent';


class ResearchExpressLicenseProposedEvent extends ProposalEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_research_license'), "create_research_license_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_research_license');
    const { external_id: licenseExternalId, research_external_id: researchExternalId, licensee, licenser } = opPayload;
    const { licensePlan } = this.offchainMeta;
    return { ...super.getSourceData(), licenseExternalId, researchExternalId, licensee, licenser, licensePlan };
  }
}

module.exports = ResearchExpressLicenseProposedEvent;