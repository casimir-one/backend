// import deipRpc from '@deip/rpc-client';
// import ResearchGroupInvite from './../schemas/ResearchGroupInvite';

// async function findResearchGroupInvite(externalId) { // proposal id
//   let research = await ResearchGroupInvite.findOne({ _id: externalId });
//   return research;
// }

// async function createResearchGroupInvite({
//   externalId,
//   member,
//   researchGroupAccount,
//   weight,
//   status,
//   notes,
//   expiration
// }) {

//   const researchGroupInvite = new ResearchGroupInvite({
//     _id: externalId,
//     member,
//     researchGroupAccount,
//     weight,
//     status,
//     notes,
//     expiration
//   })

//   return researchGroupInvite.save();
// }


// export default {
//   findResearchGroupInvite,
//   createResearchGroupInvite
// }