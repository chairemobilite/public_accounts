import { Database } from "../../../db/types";
import { Kysely, sql } from "kysely";
import { db } from "../../../db/db";
import { municPartRepository } from "../../repositories/municipal/munic_report_parts.repositories";
class ReportPartsService {
    async getReportParts() {


        const query = db
            .selectFrom("municipal_qc.report_parts")
            .selectAll()
            .orderBy(sql<number>`substring(${sql.ref('municipal_qc.report_parts.part_page_def')} from 2)::integer`)


        const data = await query.execute()

        return data
    }

    async createReportPart(desc:string,secName:string){
        const query = db
                        .insertInto('municipal_qc.report_parts')
                        .values({
                            part_desc:desc,
                            part_page_def:secName})
                        .returningAll()

        const data = await query.execute()

        return data
    }

    async deleteReportPart(part_id:number){
        const query = db
                        .deleteFrom('municipal_qc.report_parts')
                        .where('municipal_qc.report_parts.part_id','=',part_id)
                        .returningAll()

        const data = await query.execute()


        return data
    }

    async modifyReportPart(part_id:number,part_desc:string,part_page_def:string){
        const data =municPartRepository.modifyReportPartRepo(db,part_id,part_desc,part_page_def)
        return data
    }
}   



export const reportPartsService = new ReportPartsService()