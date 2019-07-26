import config from './../config';
import { resetCertificateExportLimits } from './../services/subscriptions';


async function processCertificateExportLimits(fireDate) {
  let result = await resetCertificateExportLimits();
  console.log(`${fireDate} - subscriptions export limits processed:`, result);
}


export default {
  processCertificateExportLimits
}