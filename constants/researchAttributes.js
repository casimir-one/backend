import mongoose from 'mongoose';

const TITLE = mongoose.Types.ObjectId("5f68be39c579c726e93a3006");
const DESCRIPTION = mongoose.Types.ObjectId("5f68be39c579c726e93a3007");
const INVESTMENT_OPPORTUNITY = mongoose.Types.ObjectId("5f6f34a0b1655909aba2398b");

const RESEARCH_ATTRIBUTE = {
  TITLE,
  DESCRIPTION,
  INVESTMENT_OPPORTUNITY
}

export default RESEARCH_ATTRIBUTE;