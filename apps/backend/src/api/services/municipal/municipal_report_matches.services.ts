
import { FinStateSecRowSibs, type FinStateSecAssignWLev } from "@budgets_municipaux/common";
import { db } from "../../../db/db";
import { addRowLevelEditFlagFields } from "../../../utils/addLevelEditFlagFields";
import { reshapeMatchesHelper } from "../../../utils/reshapeMatchesHelper";
import { getMatchesQuery,getGridMatchesQuery, createNewMatchQuery, UpdateMatchQuery, deleteGridQueryRun, copyFromTo, deleteByYear } from "../../repositories/municipal/munic_report_matches.repositories";
import { addRowSiblings } from "../../../utils/addSiblingsRows";
import { FinStateSecAssignWSibs } from "@budgets_municipaux/common/types/accounting.js";
class ReportMatchesService {
    async getMatches({
        part_id,
        row_id,
        col_id,
        prov_rep_id,
        year
    }: {
        row_id?: number | undefined,
        part_id?: number | undefined,
        prov_rep_id?: string | undefined,
        year?: number | undefined,
        col_id?: number | undefined,
    }) {


        const data = await getMatchesQuery(db, { row_id: row_id, part_id: part_id, year: year, prov_rep_id: prov_rep_id, col_id: col_id })

        return data
    }

    async getGridMatchesQuery({ part_id,
        year }: { part_id: number, year: number }) {


        const data = await getGridMatchesQuery(db, { part_id: part_id, year: year })
        const dataWHelper = addRowSiblings(data) as unknown as FinStateSecAssignWSibs[]
        const outData = reshapeMatchesHelper(dataWHelper)
        return outData
    }

    async createMatchGridReturn(
        part_id:number,
        row_id:number,
        col_id:number,
        year:number,
        prov_rep_id:string
    ){

        const data = await db.transaction().execute(async(trx)=>{
            const newItem=await createNewMatchQuery(part_id,row_id,col_id,year,prov_rep_id,trx)
            const data = await getGridMatchesQuery(trx, { part_id: newItem.part_id, year: newItem.year })
            const dataWHelper = addRowLevelEditFlagFields(data) as unknown as FinStateSecAssignWSibs[]
            const outData = reshapeMatchesHelper(dataWHelper)
            return outData
        })
        return data
    }
    async createMatch(
        part_id:number,
        row_id:number,
        col_id:number,
        year:number,
        prov_rep_id:string
    ){

        const newItem=await createNewMatchQuery(part_id,row_id,col_id,year,prov_rep_id,db)
        return newItem
    }
    async updateMatchGridReturn(
        match_id:number,
        part_id:number,
        row_id:number,
        col_id:number,
        year:number,
        prov_rep_id:string
    ){
        const data = await db.transaction().execute(async(trx)=>{
            const updatedItem=await UpdateMatchQuery(match_id,part_id,row_id,col_id,year,prov_rep_id,trx)
            const data = await getGridMatchesQuery(trx, { part_id: updatedItem.part_id, year: updatedItem.year })
            const dataWHelper = addRowSiblings(data) as unknown as FinStateSecAssignWSibs[]
            const outData = reshapeMatchesHelper(dataWHelper)
            return outData
        })
        return data
    }
    async updateMatch(
        match_id:number,
        part_id:number,
        row_id:number,
        col_id:number,
        year:number,
        prov_rep_id:string
    ){
        const updatedItem=await UpdateMatchQuery(match_id,part_id,row_id,col_id,year,prov_rep_id,db)

        return updatedItem
    }
    async deleteMatchGridReturn(
        match_id:number,
        part_id:number,
        year:number
    ){

        const data = await db.transaction().execute(async(trx)=>{
            const deletItem=await deleteGridQueryRun(match_id,trx)
            const data = await getGridMatchesQuery(trx, { part_id: part_id, year: year })
            const dataWHelper = addRowSiblings(data) as unknown as FinStateSecAssignWSibs[]
            const outData = reshapeMatchesHelper(dataWHelper)
            return outData
        })
        return data
    }
    async deleteMatch(
        match_id:number,
    ){


        const deleteItem=await deleteGridQueryRun(match_id,db)
        return deleteItem
    }
    async copyDataFromToService(
        year_to_copy:number,
        year_to_seed:number,
    ){  
        const data=await db.transaction().execute(async(trx)=>{
            const deleteCount= await deleteByYear(year_to_seed,trx)
            const data= await copyFromTo(year_to_copy,year_to_seed,trx)
            return true
        })
        return data
    }

}


export const serviceReportMatches = new ReportMatchesService()