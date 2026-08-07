
import { EquationCalcPrecursor } from "@budgets_municipaux/common";
import { db } from "../../../db/db";
import { reformatEqPrecursorForCalc } from "../../../utils/reformatEqPrecursForCalc";
import { 
    createEquationCalcRepo,
    createEquationVarCalcRepo,
    deleteEquationCalcRepo,
    deleteEquationVarCalcRepo,
    getEqsRepo, 
    getEquationCalcPrecRepo, 
    getEqVariablesRepo, 
    updateEquationCalcRepo,
    updateEquationVarCalcRepo
} from "../../repositories/municipal/munic_eqs.repositories";

import { create, all, type MathScope } from "mathjs";


class MunicEqsService {
    async getEquationsService({
        eq_id,
    }: {
        eq_id: number | undefined,
    }) {
        const data = getEqsRepo(db,eq_id)
        return data
    }
    async getVariablesService({eq_id,eq_var_id}:{eq_id?:number,eq_var_id?:number}){

        const data = getEqVariablesRepo(db,eq_id,eq_var_id)  
        return data
    }
    async getEquationResults({
        eq_id,
        jur_type,
        jur_id,
        year,
        capitation
    }:{
        eq_id:number,
        jur_type?:'mun'|'cm'|'reg'|'mrc',
        jur_id?:string|number,
        year?:number|undefined
        capitation?:boolean
    }){
        const data =await db.transaction().execute(async (trx)=>{
            const prec= getEquationCalcPrecRepo(
                trx,{
                    eq_id:eq_id,
                    jur_type:jur_type,
                    jur_id:jur_id,
                    year:year
                })
            return prec
        })
        const math = create(all!);
        const dataTrans = data as unknown as EquationCalcPrecursor[]
        const formatted = reformatEqPrecursorForCalc(dataTrans)
        let result
        if (capitation===true){
            result = formatted.map((r)=>{return {...r,result:math.evaluate('('+r.eq_expression+')/population',r.scope as MathScope)}})
        }else{
            result = formatted.map((r)=>{return {...r,result:math.evaluate(r.eq_expression,r.scope as MathScope)}})
        }
        
        return result
    }

    async createEquation(eq_name:string,eq_expression:string){
        const data = await createEquationCalcRepo(db,eq_name,eq_expression)
        return data
    }
    async updateEquation(eq_id:number,eq_name:string,eq_expression:string){
        const data = await updateEquationCalcRepo(db,eq_id,eq_name,eq_expression)
        return data
    }
    async createEquationVar(eq_var_symbol:string,eq_id:number,part_id:number,row_id:number,col_id:number){
        const data= await createEquationVarCalcRepo(
            db,
            eq_id,
            eq_var_symbol,
            part_id,
            row_id,
            col_id
        )
        return data
    }
    async updateEquationVar(eq_var_id:number,eq_var_symbol:string,eq_id:number,part_id:number,row_id:number,col_id:number){
        const data= await updateEquationVarCalcRepo(
            db,
            eq_var_id,
            eq_id,
            eq_var_symbol,
            part_id,
            row_id,
            col_id
        )
        return data
    }
    async deleteEquation(eq_id:number){
        const data = await deleteEquationCalcRepo(db,eq_id)
        return data
    }
    async deleteEquationVar(eq_var_id:number){
        const data = await deleteEquationVarCalcRepo(db,eq_var_id)
        return data
    }
}


export const municEqsService = new MunicEqsService()