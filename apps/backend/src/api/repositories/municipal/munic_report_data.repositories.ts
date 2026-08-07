import { Kysely, sql, Transaction } from "kysely"
import { Database } from "../../../db/types"

export const getProvIdQuery = async (
    db: Kysely<Database> | Transaction<Database>,
    year?:number,
    limit?:number,
    offset?:number,
    search_string?:string
) => {
    let query=db.selectFrom('municipal_qc.data').select('municipal_qc.data.prov_rep_id').distinct()

    let queryCount =db.selectFrom('municipal_qc.data').select(({ fn }) =>
    fn.count<number>('prov_rep_id').distinct().as('count')
)
    if (year){
        query = query.where('municipal_qc.data.year','=',year)
        queryCount = queryCount.where('municipal_qc.data.year','=',year)
    }
    if (search_string){
        query = query.where('prov_rep_id','like','%'+search_string+"%")
        queryCount= queryCount.where('municipal_qc.data.prov_rep_id','like','%'+search_string+"%")
    }
    if (limit!==undefined && offset!==undefined){
        query= query.limit(limit).offset(offset)
    }

    const totalCount = await queryCount.executeTakeFirst() as {'count':number}
    const countOut = Number(totalCount.count)
    const data = await query.execute()
    return {data,countOut}
}

export async function getDataValGridRepo(
    db:Kysely<Database>|Transaction<Database>,
    cod_geo:number,
    year:number,
    part_id:number
){
    const query = addSortRows(addFiltersGrid(forGrid(getBaseQuery(getCte(db)),cod_geo),year,part_id))

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

function getBaseQuery(query:any){
    return query
        .selectFrom('municipal_qc.rows_table as r')
        .innerJoin('municipal_qc.columns_table as c', (join:any) =>
            join.onRef('c.part_id', '=', 'r.part_id')
        )
}

function forGrid(query: any,cod_geo:number) {
    return query.crossJoin('municipal_qc.year_table as y')
        .leftJoin('municipal_qc.match as m', (join: any) =>
            join
                .onRef('m.row_id', '=', 'r.row_id')
                .onRef('m.col_id', '=', 'c.col_id')
                .onRef('y.year', '=', 'm.year')
        )
        .leftJoin('municipal_qc.data as d',(join:any)=>
            join
                .onRef('d.prov_rep_id','=','m.prov_rep_id')
                .onRef('y.year','=','d.year')
                .on('cod_geo','=',cod_geo)
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
            'd.cod_geo',
            'd.data_id',
            'row_tree.level',
            sql<number>`d.value::bigint`.as('value'),
            'd.value_text'
        ])
}

function addFiltersGrid(query:any,year:number,part_id:number){
    return query.where('r.part_id','=',part_id)
        .where('y.year','=',year)
}


function addSortRows(query:any){
    return query.orderBy(['r.part_id asc','r.item_order asc','c.column_order asc'])
}