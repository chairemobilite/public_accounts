import { Kysely, sql, Transaction } from "kysely";
import { Database } from "../../../db/types";
import { FinStateSectionCol } from "@budgets_municipaux/common";
import { addColHelperColumns } from "../../../utils";
type filters = {
    row_id?: number | undefined,
    part_id?: number | undefined,
    prov_rep_id?: string | undefined,
    year?: number | undefined,
    col_id?: number | undefined,
}

export const getMatchesQuery = async (
    db: Kysely<Database> | Transaction<Database>,
    filters: filters) => {
    const query=addFiltersReg(forReg(baseQuery(getCte(db))),filters)
    const data = await query.execute()
    return data
}

export const getGridMatchesQuery = async (
    db: Kysely<Database> | Transaction<Database>,
    filters: filters) => {
    const query=addSortRows(addFiltersGrid(forGrid(baseQuery(getCte(db))),filters))
    const data = await query.execute()
    return data
}

function getCte(db: Kysely<Database> | Transaction<Database>) {
    return db
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

}

function baseQuery(query:any) {
    return query
        .selectFrom('municipal_qc.rows_table as r')
        .innerJoin('municipal_qc.columns_table as c', (join:any) =>
            join.onRef('c.part_id', '=', 'r.part_id')
        )

}
function forGrid(query: any) {
    return query.crossJoin('municipal_qc.year_table as y')
        .leftJoin('municipal_qc.match as m', (join: any) =>
            join
                .onRef('m.row_id', '=', 'r.row_id')
                .onRef('m.col_id', '=', 'c.col_id')
                .onRef('y.year', '=', 'm.year')
        ).leftJoin('row_tree',(join:any)=>
            join
                .onRef('row_tree.row_id','=','r.row_id')
        )
        .select([
            'r.row_id',
            'r.item_order',
            'r.row_desc',
            'r.parent_id',
            'c.col_id',
            'c.column_order',
            'c.column_desc',
            'm.prov_rep_id',
            'm.match_id',
            'r.part_id',
            'y.year',
            'row_tree.level'
        ])
}

function forReg(query:any){
    return query
        .leftJoin('municipal_qc.match as m', (join: any) =>
            join
                .onRef('m.row_id', '=', 'r.row_id')
                .onRef('m.col_id', '=', 'c.col_id')
        )
        .select([
            'r.row_id',
            'r.item_order',
            'r.row_desc',
            'c.col_id',
            'c.column_order',
            'c.column_desc',
            'm.prov_rep_id',
            'm.match_id',
            'r.part_id',
            'm.year',
            'row_tree.level'])
}
function addFiltersReg(query: any, filters: filters) {
    query=addFiltersBase(query,filters)
    if (filters.year !== undefined) {
        query = query.where('m.year', '=', filters.year)
    }
    return query
}

function addFiltersGrid(query: any, filters: filters) {
    query=addFiltersBase(query,filters)
    if (filters.year !== undefined) {
        query = query.where('y.year', '=', filters.year)
    }
    return query
}

function addFiltersBase(query:any,filters:filters){
    if (filters.col_id !== undefined) {
        query = query.where('c.col_id', '=', filters.col_id)
    }
    if (filters.part_id !== undefined) {
        query = query.where('r.part_id', '=', filters.part_id)
    }
    if (filters.prov_rep_id !== undefined) {
        query = query.where('m.prov_rep_id', '=', filters.prov_rep_id)
    }
    if (filters.row_id !== undefined) {
        query = query.where('m.row_id', '=', filters.row_id)
    }

    return query
}
 
function addSortRows(query:any){
    return query.orderBy(['r.part_id asc','r.item_order asc','c.column_order asc'])
}
/**
 * Creates a new assignment between a financial statement location
 * and a provincial identifier
 * @param part_id Financial statement page
 * @param row_id row of the value
 * @param col_id column of the value
 * @param year required to account for varying data standards
 * @param prov_rep_id provincial data file identifier
 * @param db database
 * @returns 
 */
export const createNewMatchQuery=async(
    part_id:number,
    row_id:number,
    col_id:number,
    year:number,
    prov_rep_id:string,
    db:Kysely<Database>|Transaction<Database>
)=>{
    const data= await db.insertInto('municipal_qc.match')
                    .values(
                        {
                            'part_id':part_id,
                            'row_id':row_id,
                            'col_id':col_id,
                            'year':year,
                            'prov_rep_id':prov_rep_id
                        }
                    )
                    .returningAll()
                    .executeTakeFirstOrThrow()
    return data
}
export const UpdateMatchQuery=async(
    match_id:number,
    part_id:number,
    row_id:number,
    col_id:number,
    year:number,
    prov_rep_id:string,
    db:Kysely<Database>|Transaction<Database>
)=>{
    const data= await db.updateTable('municipal_qc.match')
                    .set(
                        {
                            'part_id':part_id,
                            'row_id':row_id,
                            'col_id':col_id,
                            'year':year,
                            'prov_rep_id':prov_rep_id
                        }
                    )
                    .where('match_id','=',match_id )
                    .returningAll()
                    .executeTakeFirstOrThrow()
    return data
}
export const deleteGridQueryRun=async(
    match_id:number,
    db:Kysely<Database>|Transaction<Database>
)=>{
    const data=await db.deleteFrom('municipal_qc.match')
                    .where('match_id','=',match_id)
                    .returningAll()
                    .executeTakeFirst()
    return data
}

export const deleteByYear=async(
    year_to_delete:number,
    db:Kysely<Database>|Transaction<Database>)=>{
    const data = await db.deleteFrom('municipal_qc.match').where('year','=',year_to_delete).execute()
    return data
}

export const copyFromTo=async(
    year_to_copy:number,
    year_to_seed:number,
    db:Kysely<Database>|Transaction<Database>)=>{
    const data = await db
                    .with("data_to_copy", (db) =>
                        db
                        .selectFrom("municipal_qc.match")
                        .select([
                            "part_id",
                            "col_id",
                            "row_id",
                            "prov_rep_id",
                        ])
                        .where("year", "=", year_to_copy)
                    )
                    .insertInto("municipal_qc.match")
                    .columns([
                        "year",
                        "part_id",
                        "row_id",
                        "col_id",
                        "prov_rep_id",
                    ])
                    .expression((eb) =>
                        eb
                        .selectFrom("data_to_copy")
                        .select([
                            eb.val(year_to_seed).as("year"),
                            "part_id",
                            "row_id",
                            "col_id",
                            "prov_rep_id",
                        ])
                    )
                    .execute();
        
}