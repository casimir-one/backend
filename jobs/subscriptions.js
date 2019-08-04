import config from './../config';
import subscriptionsService from './../services/subscriptions';


async function processCertificateLimits(fireDate) {
  let result = await subscriptionsService.resetCertificateLimits();
  console.log(`${fireDate} - subscriptions export limits processed:`, result);
}


export default {
  processCertificateLimits
}