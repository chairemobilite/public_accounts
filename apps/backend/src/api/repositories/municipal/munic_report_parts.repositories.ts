import { Kysely, Transaction } from "kysely";
import {  Database } from "../../../db/types";


class MunicPartRepository{
    async modifyReportPartRepo(
        db:Kysely<Database>|Transaction<Database>,
        part_id:number,
        part_desc:string,
        part_page_def:string
    ){
        const query= db.updateTable('municipal_qc.report_parts').set({
            part_desc:part_desc,
            part_page_def:part_page_def
        }).where(
            'municipal_qc.report_parts.part_id',
            '=',
            part_id
        )
        .returningAll()
        const data = query.executeTakeFirst()
        return data
    }
}

export const municPartRepository=new MunicPartRepository()