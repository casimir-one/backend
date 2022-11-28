import PortalSchema from './../../../schemas/PortalSchema';

class PortalService {

  constructor() {};

  async getPortal(id) {
    const portal = await PortalSchema.findOne({ _id: id });
    if (!portal) return null;
    return portal;
  }

  async updatePortal(portalId, {
    name,
    shortName,
    description,
    email,
    logo,
    banner
  }) {

    const portal = await PortalSchema.findOne({ _id: portalId });
    if (!portal) {
      throw new Error(`Portal ${portalId} does not exist`);
    }

    portal.name = name !== undefined ? name : portal.name;
    portal.shortName = shortName !== undefined ? shortName : portal.shortName;
    portal.description = description !== undefined ? description : portal.description;
    portal.email = email !== undefined ? email : portal.email;
    portal.logo = logo !== undefined ? logo : portal.logo;
    portal.banner = banner !== undefined ? banner : portal.banner;
    
    const savedPortalProfile = await portal.save();
    return savedPortalProfile.toObject();
  }

  async increasePortalMaxQueueNumber(portalId) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    const newNumber = portal.maxQueueNumber + 1;
    portal.maxQueueNumber = newNumber;
    await portal.save();
    return newNumber;
  }

  async updatePortalAttributeMappings(portalId, attributeMappings) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    portal.settings.attributeMappings = attributeMappings;
    const savedPortalProfile = await portal.save();
    return savedPortalProfile.toObject();
  }

  async updatePortalLayoutMappings(portalId, layoutMappings) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    portal.settings.layoutMappings = layoutMappings;
    const savedPortalProfile = await portal.save();
    return savedPortalProfile.toObject();
  }

  async updatePortalCustomFields(portalId, customFields) { // should be custom extensible object after moving to modules
    const portal = await PortalSchema.findOne({ _id: portalId });
    portal.settings.customFields = customFields;
    const savedPortalProfile = await portal.save();
    return savedPortalProfile.toObject();
  }

}

export default PortalService;