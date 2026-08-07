import { Request, RequestHandler, Response } from 'express'
import { municipalitiesServices } from '../../services/municipal/municiaplities.services'

export const getMunicipality: RequestHandler = async (
    req: Request,
    res: Response,
    next) => {
    try {

        const { year,
            cod_geo,
            region_type,
            region_id,
            pop_gt,
            pop_st,
            limit,
            offset } = req.query ?? {};
        const convertYear = year ? Number(year) : undefined
        const convertMunCode = cod_geo ? Number(cod_geo) : undefined
        const convertRegionType = region_type ? region_type as 'cm' | 'reg' | 'mrc' : undefined
        const convertRegionId = typeof region_id === 'string' && /^\d+$/.test(region_id)
            ? Number(region_id)
            : String(region_id)
        const convertPopGT = pop_gt ? Number(pop_gt) : undefined
        const convertPopST = pop_st ? Number(pop_st) : undefined
        const convertLimit = limit ? Number(limit) : undefined
        const convertOffset = limit ? Number(offset) : undefined
        const data = await municipalitiesServices.getMunicipalities(
            convertYear,
            convertMunCode,
            convertRegionType,
            convertRegionId,
            convertPopGT,
            convertPopST,
            convertLimit,
            convertOffset)
        res.status(200).json({ success: true, data: data.data, total: data.total })
        return next
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error retrieving municipalities' })
    }
}
export const getRegions: RequestHandler = async (
    req: Request,
    res: Response,
    next) => {
    try {

        const { reg_type, year } = req.query ?? {}

        const convertYear = year ? Number(year) : undefined
        if ((reg_type === 'cm' || reg_type === 'mrc' || reg_type === 'reg') && convertYear !== undefined) {
            const data = await municipalitiesServices.getRegions(reg_type, convertYear)
            res.status(200).json({ success: true, data: data })
        } else {
            throw new Error('must specify region cm mrc or reg')
        }
        return next
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error retrieving years' })
    }
}