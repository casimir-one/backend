import DisciplinesService from './../services/disciplines';

const getDomainDisciplines = async (ctx) => {
    try {
        const disciplinesService = new DisciplinesService();
        const disciplines = await disciplinesService.getDomainDisciplines();
        ctx.status = 200
        ctx.body = disciplines;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}

export default {
    getDomainDisciplines
}
