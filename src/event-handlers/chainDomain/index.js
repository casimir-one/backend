import fungibleTokenEventHandler from './impl/FungibleTokenEventHandler';
import blockEventHandler from './impl/BlockEventHandler';
import contractAgreementEventHandler from './impl/ContractAgreementEventHandler';
import daoEventHandler from './impl/DaoEventHandler';
import projectDomainEventHandler from './impl/ProjectDomainEventHandler';
import projectInvestmentOpportunityEventHandler from './impl/ProjectInvestmentOpportunityEventHandler';
import projectNdaEventHandler from './impl/ProjectNdaEventHandler';
import projectReviewEventHandler from './impl/ProjectReviewEventHandler';
import proposalEventHandler from './impl/ProposalEventHandler';
import nativeFungibleTokenEventHandler from './impl/NativeFungibleTokenEventHandler';
import nonFungibleTokenEventHandler from './impl/NonFungibleTokenEventHandler';



module.exports = {
    fungibleTokenEventHandler,
    blockEventHandler,
    contractAgreementEventHandler,
    daoEventHandler,
    projectDomainEventHandler,
    projectInvestmentOpportunityEventHandler,
    projectNdaEventHandler,
    projectReviewEventHandler,
    proposalEventHandler,
    nativeFungibleTokenEventHandler,
    nonFungibleTokenEventHandler,
}