import { Kysely, sql, Transaction } from "kysely";
import { Database } from "../../../db/types";
import { FinStateSectionCol } from "@budgets_municipaux/common";
import { addColHelperColumns } from "../../../utils";

export const upsertReportColsTransact = async (
    db: Kysely<Database> | Transaction<Database>,
    cols: FinStateSectionCol[]) => {
    const partId = [...new Set(cols.map((row) => row.part_id))];
    if (partId.length !== 1) {
        throw new Error('can only update rows for one part id at a time')
    } else {
        const newCols = cols.filter((rw) => rw.col_id < 0 || rw.col_id === null)
        if (newCols.length > 1) {
            throw new Error('cannot processs more than one new row at a time')
        }
        const updatedRows = cols.filter((rw) => rw.col_id > 0)
        let createResults: any[] = []
        let updateResults: any[] = []
        if (newCols.length > 0) {
            const createQuery = db
                .insertInto('municipal_qc.columns_table')
                .values(newCols.map((row) => {
                    return {
                        column_desc: row.column_desc,
                        part_id: row.part_id,
                        column_order: row.column_order
                    }
                }))
                .returningAll()

            createResults = await createQuery.execute()
        }

        if (updatedRows.length > 0) {
            const values = sql.join(
                updatedRows.map(u =>
                    sql`(${u.col_id}::integer, ${u.column_desc}::text, ${u.column_order}::integer,${u.part_id}::integer)`
                )
            );

            const updateQUery = sql`
                    UPDATE municipal_qc.columns_table AS mq
                    SET
                    column_desc = v.column_desc,
                    column_order = v.column_order,
                    part_id = v.part_id
                    FROM (
                    VALUES ${values}
                    ) AS v(col_id, column_desc, column_order, part_id)
                    WHERE mq.col_id = v.col_id
                    RETURNING mq.*;
                `
            const { rows: inter } = await updateQUery.execute(db)
            updateResults = inter
        }


        if (partId[0]) {
            const final_data = await db.selectFrom('municipal_qc.columns_table').selectAll().where('municipal_qc.columns_table.part_id', '=', partId[0]).orderBy('column_order').execute()
            const wcols = addColHelperColumns(final_data)
            return wcols
        } else {
            throw new Error('no part id in rows. operation failed')
        }
    }
}