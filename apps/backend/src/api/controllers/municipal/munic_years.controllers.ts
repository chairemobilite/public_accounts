import { Request, RequestHandler, Response, Router } from 'express'
import { yearService } from '../../services/municipal/municipal_years.services'

export const getYears: RequestHandler = async (
    req: Request,
    res: Response,
    next) => {
    try {

        const data = await yearService.getYears()
        res.status(200).json({ success: true, data: data })
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error retrieving years' })
    }
}
export const createYears: RequestHandler = async (req: Request, res: Response, next) => {
    try {

        const data = await yearService.createYear(req.body.year)
        res.status(200).json({ success: true, data: data })
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error creating years' })
    }
}


export const deleteYears: RequestHandler = async (req: Request, res: Response, next) => {
    try {

        const data = await yearService.deleteYear(Number(req.params.id))
        res.status(200).json({ success: true, data: data })
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error creating years' })
    }
}