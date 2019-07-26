import config from './../config';
import { resetCertificateLimits } from './../services/subscriptions';


async function processCertificateLimits(fireDate) {
  let result = await resetCertificateLimits();
  console.log(`${fireDate} - subscriptions export limits processed:`, result);
}


export default {
  processCertificateLimits
}