import PortalSchema from './../../../schemas/PortalSchema';

class PortalService {

  constructor() {};

  async createPortalProfile({
    portalId,
    name,
    shortName,
    description,
    email,
    logo,
    banner
  }, {
    signUpPolicy,
    faq,
    researchAttributes,
    layouts
  }) {

    const portalProfile = new PortalSchema({
      _id: portalId,
      name: name,
      shortName: shortName,
      description: description,
      email: email,
      logo: logo,
      banner: banner,
      settings: {
        signUpPolicy,
        faq,
        researchAttributes: researchAttributes || [],
        layouts: layouts || {}
      }
    });

    const savedPortalProfile = await portalProfile.save();
    return savedPortalProfile.toObject();
  }

  async updatePortalProfile(portalId, {
    name,
    shortName,
    description,
    email,
    logo,
    banner
  }, {
    faq,
    layouts
  }) {

    const portalProfile = await PortalSchema.findOne({ _id: portalId });
    if (!portalProfile) {
      throw new Error(`Portal ${portalId} does not exist`);
    }

    portalProfile.name = name !== undefined ? name : portalProfile.name;
    portalProfile.shortName = shortName !== undefined ? shortName : portalProfile.shortName;
    portalProfile.description = description !== undefined ? description : portalProfile.description;
    portalProfile.email = email !== undefined ? email : portalProfile.email;
    portalProfile.logo = logo !== undefined ? logo : portalProfile.logo;
    portalProfile.banner = banner !== undefined ? banner : portalProfile.banner;
    portalProfile.settings.faq = faq !== undefined ? faq : portalProfile.settings.faq;
    portalProfile.settings.layouts = layouts !== undefined ? layouts : portalProfile.settings.layouts;
    
    const savedPortalProfile = await portalProfile.save();
    return savedPortalProfile.toObject();
  }


  async updatePortalNetworkSettings(portalId, {
    globalNetworkIsVisible
  }) {
    const portalProfile = await PortalSchema.findOne({ _id: portalId });
    portalProfile.network.isGlobalScopeVisible = !!globalNetworkIsVisible;
    const savedPortalProfile = await portalProfile.save();
    return savedPortalProfile.toObject();
  }

  async updatePortalAttributeSettings(portalId, attributeSettings) {
    const portalProfile = await PortalSchema.findOne({ _id: portalId });
    portalProfile.settings.attributeSettings = attributeSettings;
    const savedPortalProfile = await portalProfile.save();
    return savedPortalProfile.toObject();
  }

  async updatePortalLayouts(portalId, layouts) {
    const portalProfile = await PortalSchema.findOne({ _id: portalId });
    portalProfile.settings.layouts = layouts;
    const savedPortalProfile = await portalProfile.save();
    return savedPortalProfile.toObject();
  }

  async updatePortalLayoutSettings(portalId, layoutSettings) {
    const portalProfile = await PortalSchema.findOne({ _id: portalId });
    portalProfile.settings.layoutSettings = layoutSettings;
    const savedPortalProfile = await portalProfile.save();
    return savedPortalProfile.toObject();
  }

  async getPortal(id) {
    const portalProfile = await PortalSchema.findOne({ _id: id });
    if (!portalProfile) return null;

    return portalProfile;
  }
}

export default PortalService;