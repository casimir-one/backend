import Subscription from './../schemas/subscription';
import moment from 'moment';

async function findSubscriptionByOwner(owner) {
  const subscription = await Subscription.findOne({ owner });
  return subscription;
}

async function createStandardSubscription(owner) {
  const subscription = new Subscription({
    owner: owner,
    pricingPlan: "standard",
    limits: {
      certificateExport: {
        counter: 0,
        resetTime: moment().add(1, 'M').toDate()
      }
    },
    expirationTime: moment().add(100, 'Y').toDate()
  });
  const savedSubscription = await subscription.save();
  return savedSubscription;
}

async function increaseCertificateExportCounter(_id) {
  const updatedSubscription = await Subscription.findOneAndUpdate({ _id }, { $inc: { "limits.certificateExport.counter": 1 } });
  return updatedSubscription;
}

async function resetCertificateExportLimits() {
  const result = await Subscription.update(
    {
      $and: [
        { "limits.certificateExport": { $exists: true } },
        { "limits.certificateExport.resetTime": { $lt: moment().endOf('day').toDate() } }
      ]
    },
    {
      "limits.certificateExport.counter": 0,
      "limits.certificateExport.resetTime": moment().add(1, 'M').toDate()
    },
    { multi: true });
  return result;
}

export {
  findSubscriptionByOwner,
  createStandardSubscription,
  resetCertificateExportLimits,
  increaseCertificateExportCounter
}