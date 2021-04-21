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

const config = require('./../config');

const mongoose = require('mongoose');
const UserProfile = require('./../schemas/user');
const Attribute = require('./../schemas/attribute');

const deipRpc = require('@deip/rpc-client');

deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const userProfiles = await UserProfile.find({tenantId: config.TENANT});
  const attributes = await Attribute.find({ tenantId: { $in: [config.TENANT, null] }, scope: 2 });

  // First Name
  // Birthday
  // Last Name
  // Bio
  // Country
  // City
  // Avatar
  // Education
  // Employment

  const userAttributesPromises = [];

  for(let i = 0; i<userProfiles.length; i++) {
    const user = userProfiles[i].toObject();

    let userBirthdate = '';

    if(user.birthdate) {
      const d = new Date(user.birthdate)
      userBirthdate = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`
    }

    userProfiles[i].attributes = [
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'First Name')._id),
        value: user.firstName
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'Birthday')._id),
        value: userBirthdate
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'Last Name')._id),
        value: user.lastName
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'Bio')._id),
        value: user.bio
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'Country')._id),
        value: user.location ? user.location.country : ''
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'City')._id),
        value: user.location ? user.location.city : ''
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'Avatar')._id),
        value: user.avatar
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'Education')._id),
        value: user.education
      },
      {
        attributeId: mongoose.Types.ObjectId(attributes.find(({title}) => title === 'Employment')._id),
        value: user.employment
      },
    ]

    userAttributesPromises.push(userProfiles[i].save());
  }
  await Promise.all(userAttributesPromises);
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