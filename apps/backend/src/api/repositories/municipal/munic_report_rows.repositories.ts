import { FinStateSectionRow } from "@budgets_municipaux/common";
import { Kysely, sql, Transaction } from "kysely";
import { Database } from "../../../db/types";
import { addRowHelperColumns } from "../../../utils";


export const upsertReportRowsTransact = async (
    db: Kysely<Database> | Transaction<Database>,
    rows: FinStateSectionRow[]) => {
    const partId = [...new Set(rows.map((row) => row.part_id))];
    if (partId.length !== 1) {
        throw new Error('can only update rows for one part id at a time')
    } else {
        const newRows = rows.filter((rw) => rw.row_id < 0 || rw.row_id === null)
        if (newRows.length > 1) {
            throw new Error('cannot processs more than one new row at a time')
        }
        const updatedRows = rows.filter((rw) => rw.row_id > 0)
        let createResults: any[] = []
        let updateResults: any[] = []
        if (newRows.length > 0) {
            const createQuery = db
                .insertInto('municipal_qc.rows_table')
                .values(newRows.map((row) => {
                    return {
                        row_desc: row.row_desc,
                        part_id: row.part_id,
                        item_order: row.item_order,
                        parent_id: row.parent_id
                    }
                }))
                .returningAll()


            createResults = await createQuery.execute()
        }

        if (updatedRows.length > 0) {
            const values = sql.join(
                updatedRows.map(u =>
                    sql`(${u.row_id}::integer, ${u.row_desc}::text, ${u.parent_id}::integer,${u.item_order}::integer,${u.part_id}::integer)`
                )
            );

            const updateQUery = sql`
            UPDATE municipal_qc.rows_table AS mq
            SET
            row_desc = v.row_desc,
            parent_id = v.parent_id,
            item_order = v.item_order,
            part_id = v.part_id
            FROM (
            VALUES ${values}
            ) AS v(row_id, row_desc, parent_id, item_order, part_id)
            WHERE mq.row_id = v.row_id
            RETURNING mq.*;
        `
            const { rows: updateResultsNew } = await updateQUery.execute(db)
            updateResults = updateResultsNew

        }

        if (partId[0]) {
            const final_data = await db.selectFrom('municipal_qc.rows_table').selectAll().where('municipal_qc.rows_table.part_id', '=', partId[0]).orderBy('item_order asc').execute()
            return addRowHelperColumns(final_data)
        } else {
            throw new Error('no part id in rows. operation failed')
        }

    }
}

export const buildRunGetRowQuery = async(
    db:Kysely<Database>|Transaction<Database>,
    row_id:number|undefined,
    part_id:number|undefined,
    parent_id:number|undefined,
    prov_rep_id:string|undefined,
    col_id:number|undefined,
    row_desc:string|undefined
)=>{
    let query = db
                .selectFrom("municipal_qc.rows_table")
                .select([
                    'municipal_qc.rows_table.part_id',
                    'municipal_qc.rows_table.row_id',
                    'municipal_qc.rows_table.parent_id',
                    'municipal_qc.rows_table.row_desc',
                    'municipal_qc.rows_table.item_order'
                ]
                ).orderBy('item_order asc')
            if (row_id !== undefined) {
                query = query.where('row_id', '=', row_id)
            }
            if (part_id !== undefined) {
                query = query.where('part_id', '=', part_id)
            }
            if (parent_id !== undefined) {
                query = query.where('parent_id', '=', parent_id)
            }
            if (prov_rep_id !== undefined) {
                query = query.leftJoin(
                    'municipal_qc.match',
                    'municipal_qc.match.row_id',
                    'municipal_qc.rows_table.row_id'
                ).where(
                    'municipal_qc.match.prov_rep_id',
                    '=',
                    prov_rep_id
                )
            }
            if (col_id !== undefined) {
                query = query.leftJoin(
                    'municipal_qc.match',
                    'municipal_qc.match.row_id',
                    'municipal_qc.rows_table.row_id'
                ).where(
                    'municipal_qc.match.col_id',
                    '=',
                    col_id)
            }
            if (row_desc !== undefined) {
                query = query.where('row_desc', 'like', row_desc)
            }

            const data = await query.execute()
}