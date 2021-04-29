import DisciplinesService from './../../services/legacy/disciplines';

const getDomainDisciplines = async (ctx) => {
  try {
    const disciplinesService = new DisciplinesService();
    const disciplines = await disciplinesService.getDomainDisciplines();
    ctx.status = 200
    ctx.body = disciplines;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getDisciplinesByResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  try {
    const disciplinesService = new DisciplinesService();
    const disciplines = await disciplinesService.getDisciplinesByResearch(researchExternalId);
    ctx.status = 200;
    ctx.body = disciplines;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  getDomainDisciplines,
  getDisciplinesByResearch
}
