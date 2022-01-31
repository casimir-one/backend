require("@babel/register")({
  "presets": [
    [
      "@babel/env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ]
});

require("@babel/register")({
  "only": [
    function (filepath) {
      return filepath.includes("node_modules/@deip") || filepath.includes("node_modules/crc");
    },
  ]
});


const config = require('./../config');
const mongoose = require('mongoose');
const { ATTR_SCOPES } = require('@deip/constants');
const LayoutSchema = require('./../schemas/LayoutSchema');
const PortalSchema = require('./../schemas/PortalSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const portal = await PortalSchema.findOne({ _id: config.TENANT });
  const portalRef = portal.toObject();
  const layoutsPromises = [];

  const getScopeFromName = (name) => {
    if (name.includes('User') || name.includes('user') || name.includes('account') || name.includes('Account') || name.includes('sign') || name.includes('Sign')) {
      return ATTR_SCOPES.find(s => s === 'user') || 'user'
    }
    if (name.includes('Project') || name.includes('project')) {
      return ATTR_SCOPES.find(s => s === 'project') || 'project'
    }
    if (name.includes('Team') || name.includes('team')) {
      return ATTR_SCOPES.find(s => s === 'team') || 'team'
    }
  }

  const getType = (type) => {
    const types = ['details', 'form'];
    const typesMap = {
      1: 'form',
      2: 'details'
    };
    if (!type) {
      return types[0]
    }
    if (typeof type === 'string' && types.includes(type)) {
      return type
    } else if (typeof type === 'string') {
      return types[0]
    }
    if (typeof type === 'number') {
      return typesMap[type] || types[0]
    }
    return types[0]
  }

  for (let i = 0; i < Object.values(portalRef.settings.layouts).length; i++) {
    const oldLayout = Object.values(portalRef.settings.layouts)[i];
    const layout = new LayoutSchema({
      portalId: config.TENANT,
      name: oldLayout.name,
      value: oldLayout.value || oldLayout.schema || oldLayout.layout,
      scope: oldLayout.scope || getScopeFromName(oldLayout.name) || ATTR_SCOPES[0],
      type: getType(oldLayout.type)
    });
    
    layoutsPromises.push(layout.save());
  }

  await Promise.all(layoutsPromises);
    
};

run()
  .then(() => {
    console.log('Successfully finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });