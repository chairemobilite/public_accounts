import { Database } from "../../../db/types";
import { Kysely } from "kysely";
import { db } from "../../../db/db";
class YearsService {
    async getYears() {


        const query = db
            .selectFrom("municipal_qc.year_table")
            .selectAll()


        const data = await query.execute()



        return data
    }
    async createYear(year:number){

        const query = db
            .insertInto("municipal_qc.year_table")
            .values({'year':year})
            .returningAll()


        const data = await query.execute()



        return data
    }

    async deleteYear(year:number){

        const query = db
            .deleteFrom("municipal_qc.year_table")
            .where("municipal_qc.year_table.year",'=',year)
            .returningAll()

        const data = await query.execute()

        return data
    }
}   


export const yearService = new YearsService()