import BaseService from './../../base/BaseService';
import DocumentTemplateSchema from './../../../schemas/DocumentTemplateSchema';

class DocumentTemplateService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(DocumentTemplateSchema, options);
  }

  async createDocumentTemplate({
    account,
    title,
    body,
    creator
  }) {
    const documentTemplate = await this.createOne({
      account,
      title,
      body,
      creator
    });

    return documentTemplate;
  }

  async updateDocumentTemplate({
    _id: id,
    title,
    body
  }) {
    const updatedDocumentTemplate = this.updateOne({ _id: id }, {
      title,
      body
    });

    return updatedDocumentTemplate;
  }

  async deleteDocumentTemplate(id) {
    const deletedDocumentTemplate = await this.deleteOne({ _id: id});
    return deletedDocumentTemplate;
  }
}

export default DocumentTemplateService;