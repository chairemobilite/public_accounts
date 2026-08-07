
import { FinStateSecValueSibs, FinStateSecValueWLev, type FinStateSecAssignWLev } from "@budgets_municipaux/common";
import { db } from "../../../db/db";
import { addRowLevelEditFlagFields } from "../../../utils/addLevelEditFlagFields";
import { reshapeMatchesHelper } from "../../../utils/reshapeMatchesHelper";
import { getMatchesQuery,getGridMatchesQuery } from "../../repositories/municipal/munic_report_matches.repositories";
import { getDataValGridRepo, getProvIdQuery } from "../../repositories/municipal/munic_report_data.repositories";
import { reshapeDataHelper } from "../../../utils/reshapeDataHelper";
import { addRowSiblings } from "../../../utils/addSiblingsRows";
import { rollUpChildValuesOnNull } from "../../../utils/rollupChildValuesOnNull";

class ReportDataService {
    async getProvIds(year?:number,limit?:number,offset?:number,search_string?:string) {


        const {data,countOut} = await getProvIdQuery(db, year, limit,offset,search_string)

        return {data,countOut}
    }
    /**service layer for retrieving tax data
     * 
     * @param year year for which you're getting data
     * @param code_geo municipality for which you're getting data
     * @param part_id report page you're getting data for
     */
    async getDataValGridServ(year:number,code_geo:number,part_id:number){
        const rawData = await getDataValGridRepo(db,code_geo,year,part_id)
        const wSibs= addRowSiblings(rawData) as unknown as FinStateSecValueSibs[]
        const grid = reshapeDataHelper(wSibs)
        const gridRollup = rollUpChildValuesOnNull(grid)
        return gridRollup
    }
}

export const reportDataService = new ReportDataService()