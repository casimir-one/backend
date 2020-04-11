import AwardWithdrawalRequest from './../schemas/awardWithdrawalRequest';

async function findAwardWithdrawalRequest(awardNumber, paymentNumber) {
  const withdrawal = await AwardWithdrawalRequest.findOne({ awardNumber, paymentNumber });
  return withdrawal;
}

export default {
  findAwardWithdrawalRequest
}
