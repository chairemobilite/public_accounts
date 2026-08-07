
import { sql } from "kysely";
import { db } from "../../../db/db";
import { FinStateSecRowLev, FinStateSecRowWHelp, FinStateSectionRow } from "@budgets_municipaux/common";
import { cleanRowOrderAfterDelete } from "../../../utils/cleanOrderAfterDelete";
import { addRowHelperColumns, stripRowHelperColumns } from "../../../utils";
import { upsertReportRowsTransact } from "../../repositories/municipal/munic_report_rows.repositories";
import { moveRowHelper } from "../../../utils/moveHelpers";
import { newColHelper, newRowHelper } from "../../../utils/newItemHelper";
import { stripRowHelperColumnsLev } from "../../../utils/stripHelperColumns";
import { addRowSiblings } from "../../../utils/addSiblingsRows";
import { addRowMoveFlagField } from "../../../utils/addMoveFlagFIelds";
class ReportRowsService {
    async getReportRows({
        row_id,
        part_id,
        parent_id,
        prov_rep_id,
        year,
        col_id,
        row_desc
    }: {
        row_id: number | undefined,
        part_id: number | undefined,
        parent_id?: number | undefined,
        prov_rep_id?: string | undefined,
        year?: number | undefined,
        col_id?: number | undefined,
        row_desc?: string | undefined
    }) {

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


        return data
    }

    async UpsertReportRows(rows: FinStateSectionRow[]) {
        const result = await db.transaction().execute(async (trx) => {
            return await upsertReportRowsTransact(trx, rows)
        })
        return result
    }

    async deleteReportRows(id: number) {
        const result = await db.transaction().execute(async (trx) => {
            const deleteQuery = trx
                .deleteFrom('municipal_qc.rows_table')
                .where('row_id', "=", id)
                .returningAll()

            const deleteData = await deleteQuery.execute()
            const deletedPartId = deleteData[0]?.part_id
            if (!deletedPartId) {
                throw new Error('failure on retrieving deleted part id')
            }

            const partRows = await trx.selectFrom('municipal_qc.rows_table').selectAll().where('part_id', '=', deletedPartId).orderBy('item_order asc').execute()
            const compacted = cleanRowOrderAfterDelete(partRows as unknown as FinStateSectionRow[])
            const upsert = await upsertReportRowsTransact(trx, compacted)
            return upsert
        })
        return result
    }

    async moveReportRow(part_id: number, row_id: number, move: 'up' | 'down') {
        const data = db.transaction().execute(
            async (trx) => {

                const initialData = await trx
                    .selectFrom('municipal_qc.rows_table').selectAll()
                    .where('municipal_qc.rows_table.part_id', '=', part_id)
                    .execute()
                const dataWHelp = addRowHelperColumns(initialData)
                const movedArray = moveRowHelper(dataWHelp, row_id, move)
                const changeArray = movedArray.filter((rowF) => rowF.edit_flag === true)
                const finalData = await upsertReportRowsTransact(trx, changeArray)
                return finalData
            }
        )
        return data
    }
    async newReportRow(part_id: number, row_desc: string, parent_id: number | null | undefined) {
        const data = db.transaction().execute(
            async (trx) => {
                const initialData = await trx
                    .selectFrom('municipal_qc.rows_table').selectAll()
                    .where('municipal_qc.rows_table.part_id', '=', part_id)
                    .execute()
                // insert in order to get 
                let newItem: FinStateSectionRow
                if (parent_id === null || parent_id === undefined) {
                    newItem = {
                        row_id: -1,
                        row_desc: row_desc,
                        part_id: part_id,
                        item_order: -1,
                        parent_id: null
                    }
                } else {
                    newItem = {
                        row_id: -1,
                        row_desc: row_desc,
                        part_id: part_id,
                        item_order: -1,
                        parent_id: parent_id
                    }
                }

                const oldArrayWHelp = addRowHelperColumns(initialData)
                const insertedArray = newRowHelper(oldArrayWHelp, newItem)
                const colsToUpsert = stripRowHelperColumns(insertedArray.filter((c) => c.edit_flag === true))
                const finalData = await upsertReportRowsTransact(trx, colsToUpsert)
                return finalData
            }
        )
        return data
    }

    async changeParentRow(part_id: number, row_desc: string, new_parent_id: number | null, row_id: number) {
        const data = db.transaction().execute(
            async (trx) => {
                const initialData = await trx
                    .withRecursive('row_tree', (cte) =>
                        cte
                            .selectFrom('municipal_qc.rows_table as r')
                            .select([
                                'r.row_id',
                                sql<number>`0`.as('level')
                            ])
                            .where('r.parent_id', 'is', null)

                            .unionAll(
                                cte
                                    .selectFrom('municipal_qc.rows_table as child')
                                    .innerJoin(
                                        'row_tree as parent',
                                        'child.parent_id',
                                        'parent.row_id'
                                    )
                                    .select([
                                        'child.row_id',
                                        sql<number>`parent.level + 1`.as('level')
                                    ])
                            )
                    )
                    .selectFrom('municipal_qc.rows_table').selectAll()
                    .leftJoin('row_tree', (join: any) =>
                        join
                            .onRef('row_tree.row_id', '=', 'rows_table.row_id')
                    )
                    .where('municipal_qc.rows_table.part_id', '=', part_id)
                    .orderBy('item_order')
                    .execute()
                // insert in order to get 
                const convert = initialData as FinStateSecRowLev[]
                const addHelp: FinStateSecRowWHelp[] = addRowMoveFlagField(addRowSiblings(convert)).map((r)=>{return{...r,edit_flag:false}})
                const itemToStrip:FinStateSecRowWHelp = addHelp.find((r) => r.row_id === row_id) 
                if (!itemToStrip) {
                    throw new Error("could not find the row who's parent you want to change")
                }
                // split this into two blocks, the things that are part of the item's block and the res
                const otherItemsTwo = addHelp.filter((r)=>r.item_order<itemToStrip.item_order||r.item_order>itemToStrip.end_block)
                const itemBlock = addHelp.filter((r)=>r.item_order>=itemToStrip.item_order && r.item_order<=itemToStrip.end_block)
                let modItemBlock:any[];
                let beforeBlock:any[];
                let afterBlock:any[];
                modItemBlock = itemBlock.map((r)=>{if(r.row_id!==row_id){return r}else{return{...r,parent_id:new_parent_id,edit_flag:true}}})
                if (new_parent_id!==null){
                    const newParent = otherItemsTwo.find((r)=>r.row_id ===new_parent_id)
                    if (!newParent){
                        throw new Error("could not find the parent you'reg trying to assign to or trying to relocate within children")
                    }
                    if (newParent.item_order>=itemToStrip.item_order&&newParent.item_order<itemToStrip.end_block){
                        throw new Error("You can't relocate the the parent within its children")
                    }
                    // modify the item block to change the parent id of the item to move
                    
                    // Split the otherItems block into the ones that are before and after the new parent, this is where we'll slot the item
                    
                    beforeBlock = otherItemsTwo.filter((r)=>r.item_order<=newParent.item_order)
                    afterBlock = otherItemsTwo.filter((r)=>r.item_order>newParent.item_order)
                }else{
                    beforeBlock = otherItemsTwo
                    afterBlock=[]
                }
                // recreate the array and reset the item order
                const newArrayWrongOrder = [...beforeBlock,...modItemBlock,...afterBlock]
                const newArrayRightOrder = newArrayWrongOrder.map((r,i)=>{if (i+1!==r.item_order||r.edit_flag===true){
                        return{...r,item_order:i+1,edit_flag:true}
                    }else{
                        return{...r,item_order:i+1,edit_flag:false}
                    }})
                
                const arrayToUpsert = newArrayRightOrder.filter((r)=>r.edit_flag===true)
                const finalArray = stripRowHelperColumns(arrayToUpsert)
                
                const finalData = await upsertReportRowsTransact(trx, finalArray)
                return []
            }
        )
        return data
    }
}


export const reportRowsService = new ReportRowsService()