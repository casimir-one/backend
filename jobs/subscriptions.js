import config from './../config';
import subscriptionsService from './../services/subscriptions';


async function processCertificateLimits(fireDate) {
  let result = await subscriptionsService.resetCertificatesLimitCounter();
  console.log(`${fireDate} - subscriptions export limits processed:`, result);
}


export default {
  processCertificateLimits
}