import { sql } from "kysely"
import { db,  } from "../../../db/db"
import { MunicUpdate, NewMunic } from "../../../db/municipal/MunicipalityTable"
class MunicipalitiesServices {
    async getMunicipalities(year:string|number|undefined,
                            mun_code:number|undefined,
                            region_type:'cm'|'reg'|'mrc'|undefined,
                            region_id:number|string|undefined,
                            pop_gt:number|undefined,
                            pop_st:number|undefined,
                            limit:number|undefined,
                            offset:number|undefined){

        let limit_query = db
            .selectFrom('municipal_qc.municipalities').selectAll()
        let no_limit_query = db.selectFrom('municipal_qc.municipalities')
        if (year && typeof Number(year) ==='number'){
            limit_query = limit_query.where('municipal_qc.municipalities.year','=',Number(year))
            no_limit_query = no_limit_query.where('municipal_qc.municipalities.year','=',Number(year))
        }
        if (mun_code && typeof Number(mun_code) ==='number'){
            limit_query = limit_query.where('municipal_qc.municipalities.cod_geo','=',mun_code)
            no_limit_query = no_limit_query.where('municipal_qc.municipalities.cod_geo','=',mun_code)
        }
        if (region_type && region_id){
            if (region_type==='cm'){
                limit_query = limit_query.where('municipal_qc.municipalities.cod_cm','=',String(region_id))
                no_limit_query = no_limit_query.where('municipal_qc.municipalities.cod_cm','=',String(region_id))
            }
            if(region_type ==='mrc'){
                limit_query = limit_query.where('municipal_qc.municipalities.cod_mrc','=',String(region_id))
                no_limit_query = no_limit_query.where('municipal_qc.municipalities.cod_mrc','=',String(region_id))
            }
            if(region_type==='reg'&& isFinite(Number(region_id))){
                limit_query = limit_query.where('municipal_qc.municipalities.no_reg','=',String(region_id))
                no_limit_query = no_limit_query.where('municipal_qc.municipalities.no_reg','=',String(region_id))
            }
        }
        if (pop_gt && typeof Number(pop_gt) ==='number'){
            limit_query = limit_query.where('municipal_qc.municipalities.population','>=',pop_gt)
            no_limit_query = no_limit_query.where('municipal_qc.municipalities.population','>=',pop_gt)
        }
        if (pop_st && typeof Number(pop_st) ==='number'){
            limit_query = limit_query.where('municipal_qc.municipalities.population','<=',pop_st)
            no_limit_query = no_limit_query.where('municipal_qc.municipalities.population','<=',pop_st)
        }
        no_limit_query = no_limit_query.select(db.fn.count<number>('cod_geo').as('count'))
        if (typeof limit==='number' && typeof offset==='number'){
            limit_query = limit_query.limit(limit).offset(offset)
        }
        const data = await limit_query
            .execute()
        const result:any = await no_limit_query.executeTakeFirst()
        const total = Number(result?.count ?? 0)
        return {data,total}
    }

    async getRegions(region_type:'cm'|'reg'|'mrc',year:number){

        let query = db.selectFrom('municipal_qc.municipalities')
        let data
        if (region_type==='cm'){
            query = query
                        .select('municipal_qc.municipalities.cod_cm as reg_code')
                        .select('municipal_qc.municipalities.nom_cm as reg_name')
                        .select(sql<string>`'cm'`.as('reg_type'))
                        .where('municipal_qc.municipalities.year','=',year).distinct();
            data = await query.execute()
            return data
        }
        if (region_type==='mrc'){
            query = query
                        .select('municipal_qc.municipalities.cod_mrc as reg_code')
                        .select('municipal_qc.municipalities.nom_mrc as reg_name')
                        .select(sql<string>`'mrc'`.as('reg_type'))
                        .where('municipal_qc.municipalities.year','=',year).distinct();
            data = await query.execute()
            return data
        }
        if (region_type==='reg'){
            query = query
                        .select('municipal_qc.municipalities.no_reg as reg_code')
                        .select('municipal_qc.municipalities.desc_reg as reg_name')
                        .select(sql<string>`'mrc'`.as('reg_type'))
                        .where('municipal_qc.municipalities.year','=',year).distinct();
            data = await query.execute()
            return data
        }else {
            throw new Error('invalid region type')
        }
        
    }
    async createMunicipalities(munic:NewMunic){

        const data = await db
                        .insertInto('municipal_qc.municipalities')
                        .values(munic)
                        .returningAll()
                        .execute()
        return data
    }
    async updateMunicipalities(munic:MunicUpdate,munic_id:number){
 
        const data = await db 
                            .updateTable('municipal_qc.municipalities')
                            .set(munic)
                            .where(
                                'municipal_qc.municipalities.year_mun_id',
                                '=',
                                munic_id
                            ).returningAll()
                            .execute()
        return data
    }
    async deleteMunicByYear(year:number){

        const data = await db
                            .deleteFrom('municipal_qc.municipalities')
                            .where('municipal_qc.municipalities.year','=',year)
                            .execute()
        return data
    }
}

export const  municipalitiesServices = new MunicipalitiesServices() 