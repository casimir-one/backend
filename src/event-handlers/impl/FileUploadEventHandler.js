import { CONTRACT_AGREEMENT_STATUS } from '@deip/constants';

import BaseEventHandler from '../base/BaseEventHandler';
import APP_EVENT from '../../events/base/AppEvent';
import { ContractAgreementDtoService } from '../../services';
import FileStorage from '../../storage';
import { generatePdf } from '../../utils/pdf';

const getContractFilePath = async (filename) => {
  const contractAgreementDir = FileStorage.getContractAgreementDirPath();
  const isDirExists = await FileStorage.exists(contractAgreementDir);

  if (isDirExists) {
    const filePath = FileStorage.getContractAgreementFilePath(filename);
    const fileExists = await FileStorage.exists(filePath);

    if (fileExists) {
      await FileStorage.delete(filePath);
    }
  } else {
    await FileStorage.mkdir(contractAgreementDir);
  }

  return FileStorage.getContractAgreementFilePath(filename);
};

const saveContractPdf = async (content, filename) => {
  const filePath = await getContractFilePath(filename);
  const pdfBuffer = await generatePdf(content);

  await FileStorage.put(filePath, pdfBuffer);
};

class FileUploadEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }
}

const fileUploadEventHandler = new FileUploadEventHandler();
const contractAgreementDtoService = new ContractAgreementDtoService();

fileUploadEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED, async (event) => {
  const {
    terms,
    pdfContent
  } = event.getEventPayload();

  if (pdfContent && terms.filename) {
    await saveContractPdf(pdfContent, terms.filename);
  }
});

fileUploadEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_CREATED, async (event) => {
  const {
    entityId: contractAgreementId,
    terms,
    pdfContent
  } = event.getEventPayload();

  if (pdfContent && terms.filename) {
    const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);
    if (!contractAgreement || contractAgreement.status !== CONTRACT_AGREEMENT_STATUS.PROPOSED) {
      await saveContractPdf(pdfContent, terms.filename);
    }
  }
});

export default fileUploadEventHandler;
