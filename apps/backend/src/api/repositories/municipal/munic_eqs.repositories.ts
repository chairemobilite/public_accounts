import { Kysely, sql, Transaction } from "kysely";
import { Database } from "../../../db/types";


export const getEqsRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_id: number | undefined
) => {
    let query = db.selectFrom('municipal_qc.eqs_table').selectAll()
    if (eq_id) {
        query = query.where('eq_id', '=', eq_id)
    }
    const data = await query.execute()
    return data
}

export const getEqVariablesRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_id: number | undefined,
    eq_var_id: number | undefined
) => {
    let query = db.selectFrom('municipal_qc.eq_vars_table as v')
        .leftJoin('municipal_qc.rows_table as r',(join)=>
            join.onRef(
                'v.row_id','=','r.row_id'))
        .leftJoin('municipal_qc.columns_table as c',(join)=>
            join.onRef('v.col_id','=','c.col_id')
        ).leftJoin('municipal_qc.report_parts as p',(join)=>
            join.onRef('v.part_id','=','p.part_id')   
        )
        .select([
            'v.eq_var_id',
            'v.eq_id',
            'v.col_id',
            'c.column_desc',
            'v.row_id',
            'r.row_desc',
            'v.part_id',
            'p.part_desc',
            'v.eq_var_symbol'
        ])
    if (eq_id) {
        query = query.where('v.eq_id', '=', eq_id)
    }
    if (eq_var_id) {
        query = query.where('v.eq_var_id', '=', eq_var_id)
    }
    const data = await query.orderBy(['v.part_id','r.item_order']).execute()
    return data
}

interface filters {
    eq_id: number | undefined,
    jur_type?: 'cm' | 'mun' | 'mrc' | 'reg' | undefined,
    jur_id?: string | number | undefined,
    year?: number | undefined
}

export const getEquationCalcPrecRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    filts: filters
) => {
    let query = db.selectFrom('municipal_qc.eqs_table as e')
        .leftJoin('municipal_qc.eq_vars_table as ev',
            (join) => join.onRef('ev.eq_id', '=', 'e.eq_id'))
        .leftJoin('municipal_qc.match as m',
            (join) =>
                join
                    .onRef('ev.col_id', '=', 'm.col_id')
                    .onRef('ev.row_id', '=', 'm.row_id')
                    .onRef('ev.part_id', '=', 'm.part_id')
        ).leftJoin('municipal_qc.municipalities as mun',
            (join) =>
                join
                    .onRef('mun.year', '=', 'm.year')
        )
        .leftJoin('municipal_qc.data as d',
            (join) =>join
                    .onRef('d.prov_rep_id', '=', 'm.prov_rep_id')
                    .onRef('d.year', '=', 'm.year')
                    .onRef('mun.cod_geo','=','d.cod_geo')
        )
    if (filts.eq_id) {
        query = query.where('e.eq_id', '=', filts.eq_id)
    }
    if (filts.jur_type === 'mun' && typeof filts.jur_id === 'number') {
        query = query.where('mun.cod_geo', '=', filts.jur_id)
    }
    if (filts.jur_type === 'mrc' && typeof filts.jur_id === 'string') {
        query = query.where('mun.cod_mrc', '=', filts.jur_id)
    }
    if (filts.jur_type === 'cm' && typeof filts.jur_id === 'string') {
        query = query.where('mun.cod_cm', '=', filts.jur_id)
    }
    if (filts.jur_type === 'reg' && typeof filts.jur_id === 'number') {
        query = query.where('mun.no_reg', '=', filts.jur_id)
    }
    if (filts.year) {
        query = query.where('m.year', '=', filts.year)
    }
    query = query.select([
        'mun.cod_geo',
        'mun.year',
        'mun.nom_organisme',
        'mun.population',
        'ev.part_id',
        'ev.row_id',
        'ev.col_id',
        'ev.eq_var_symbol',
        'e.eq_id',
        'e.eq_name',
        'e.eq_expression',
        'm.prov_rep_id',
        sql<number>`COALESCE(d.value,0)::bigint`.as('value'),
    ]).orderBy(['mun.population desc','eq_var_id asc'])
    const data = await query.execute()
    return data
}

export const createEquationCalcRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_name: string,
    eq_expression: string) => {
    const data = await db.insertInto('municipal_qc.eqs_table').values({
        eq_name: eq_name,
        eq_expression: eq_expression
    }).returningAll().execute()
    return data
}

export const updateEquationCalcRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_id: number,
    eq_name: string,
    eq_expression: string
) => {
    const data = await db
        .updateTable('municipal_qc.eqs_table')
        .set({ eq_expression: eq_expression, eq_name: eq_name })
        .where('eq_id', '=', eq_id)
        .returningAll()
        .execute()
    return data
}

export const deleteEquationCalcRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_id: number,
) => {
    const data = await db
        .deleteFrom('municipal_qc.eqs_table')
        .where('eq_id', '=', eq_id)
        .returningAll()
        .execute()
    return data
}

export const createEquationVarCalcRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_id: number,
    eq_var_symbol: string,
    part_id: number,
    row_id: number,
    col_id: number
) => {
    const data = await db.insertInto('municipal_qc.eq_vars_table').values({
        eq_id: eq_id,
        eq_var_symbol: eq_var_symbol,
        part_id: part_id,
        row_id: row_id,
        col_id: col_id
    }).returningAll().execute()
    return data
}

export const updateEquationVarCalcRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_var_id: number,
    eq_id: number,
    eq_var_symbol: string,
    part_id: number,
    row_id: number,
    col_id: number
) => {
    const data = await db.updateTable('municipal_qc.eq_vars_table').set({
        eq_id: eq_id,
        eq_var_symbol: eq_var_symbol,
        part_id: part_id,
        row_id: row_id,
        col_id: col_id
    }).where('municipal_qc.eq_vars_table.eq_var_id', '=', eq_var_id).returningAll().execute()
    return data
}


export const deleteEquationVarCalcRepo = async (
    db: Kysely<Database> | Transaction<Database>,
    eq_var_id: number,
) => {
    const data = await db
        .deleteFrom('municipal_qc.eq_vars_table')
        .where('eq_var_id', '=', eq_var_id)
        .returningAll()
        .execute()
    return data
}