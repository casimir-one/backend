import DocumentTemplateSchema from '../../../schemas/DocumentTemplateSchema';
import BaseService from '../../base/BaseService';

class DocumentTemplateDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(DocumentTemplateSchema, options);
  }

  async getDocumentTemplate(id) {
    const documentTemplate = await this.findOne({ _id: id });
    return documentTemplate;
  }

  async getDocumentTemplatesByAccount(account) {
    const documentTemplates = await this.findMany({ account });
    return documentTemplates;
  }
 
}

export default DocumentTemplateDtoService;