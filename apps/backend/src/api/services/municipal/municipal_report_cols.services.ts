
import { sql } from "kysely";
import { db } from "../../../db/db";
import { FinStateSectionCol, FinStateSectionRow } from "@budgets_municipaux/common";
import { addColHelperColumns, stripColHelperColumns } from "../../../utils";
import { cleanColOrderAfterDelete } from "../../../utils/cleanOrderAfterDelete";
import { upsertReportColsTransact } from "../../repositories/municipal/munic_report_cols.repositories";
import { moveColHelper } from "../../../utils/moveHelpers";
import { newColHelper } from "../../../utils/newItemHelper";
class ReportColsService {
    async getReportCols({
        row_id,
        part_id,
        parent_id,
        prov_rep_id,
        year,
        col_id,
        column_desc
    }: {
        row_id: number | undefined,
        part_id: number | undefined,
        parent_id?: number | undefined,
        prov_rep_id?: string | undefined,
        year?: number | undefined,
        col_id?: number | undefined,
        column_desc?: string | undefined
    }) {


        let query = db
            .selectFrom("municipal_qc.columns_table")
            .selectAll().orderBy('column_order asc')
        if (col_id !== undefined) {
            query = query.where('col_id', '=', col_id)
        }
        if (part_id !== undefined) {
            query = query.where('part_id', '=', part_id)
        }
        if (prov_rep_id !== undefined) {
            query = query.leftJoin('municipal_qc.match', 'municipal_qc.match.col_id', 'municipal_qc.columns_table.col_id').where('municipal_qc.match.prov_rep_id', '=', prov_rep_id)
        }
        if (row_id !== undefined) {
            query = query.leftJoin('municipal_qc.match', 'municipal_qc.match.col_id', 'municipal_qc.columns_table.col_id').where('municipal_qc.match.row_id', '=', row_id)
        }
        if (column_desc !== undefined) {
            query = query.where('column_desc', 'like', column_desc)
        }

        const data = await query.execute()
        const wcols = addColHelperColumns(data)

        return wcols
    }

    async UpsertReportCols(cols: FinStateSectionCol[]) {
        const result = await db.transaction().execute(
            async (trx) => {
                return await upsertReportColsTransact(trx, cols)
            }
        )
        return result
    }


    async deleteReportCols(id: number) {
        const result = await db.transaction().execute(async (trx) => {
            const deleteQuery = trx
                .deleteFrom('municipal_qc.columns_table')
                .where('col_id', "=", id)
                .returningAll()

            const deleteData = await deleteQuery.execute()
            const deletedPartId = deleteData[0]?.part_id
            if (!deletedPartId) {
                throw new Error('failure on retrieving deleted part id')
            }

            const partRows = await trx.selectFrom('municipal_qc.columns_table').selectAll().where('part_id', '=', deletedPartId).orderBy('column_order asc').execute()
            const compacted = cleanColOrderAfterDelete(partRows as unknown as FinStateSectionCol[])
            const upsert = await upsertReportColsTransact(trx, compacted)
            return upsert
        })
        return result
    }

    async moveReportCol(part_id: number, row_id: number, move: 'left' | 'right') {
        const data = db.transaction().execute(
            async (trx) => {

                const initialData = await trx
                    .selectFrom('municipal_qc.columns_table').selectAll()
                    .where('municipal_qc.columns_table.part_id', '=', part_id)
                    .execute()
                const dataWHelp = addColHelperColumns(initialData)
                const movedArray = moveColHelper(dataWHelp, row_id, move)
                const changeArray = movedArray.filter((rowF) => rowF.edit_flag === true)
                const finalData = await upsertReportColsTransact(trx, changeArray)
                return finalData
            }
        )
        return data
    }
    async newReportCol(part_id:number,column_desc:string){
        const data = db.transaction().execute(
            async (trx) => {

                const initialData = await trx
                    .selectFrom('municipal_qc.columns_table').selectAll()
                    .where('municipal_qc.columns_table.part_id', '=', part_id)
                    .execute()
                // insert in order to get 
                const newItem= {
                    col_id:-1,
                    column_desc:column_desc,
                    part_id:part_id,
                    column_order:-1
                }
                const oldArrayWHelp=addColHelperColumns(initialData)
                const insertedArray= newColHelper(oldArrayWHelp,newItem)
                const colsToUpsert=stripColHelperColumns(insertedArray.filter((c)=>c.edit_flag===true))
                const finalData = await upsertReportColsTransact(trx, colsToUpsert)
                return finalData
            }
        )
        return data
    }
}


export const reportColsService = new ReportColsService()