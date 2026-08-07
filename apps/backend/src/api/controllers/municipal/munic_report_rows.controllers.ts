import { Request, RequestHandler, Response, Router } from 'express'
import { reportPartsService } from '../../services/municipal/municipal_report_parts.services'
import { reportRowsService } from '../../services/municipal/municipal_report_rows.services'
import { addRowHelperColumns } from '../../../utils'



export const getReportRows: RequestHandler = async (
    req: Request,
    res: Response,
    next) => {
    try {

        const {
            row_id,
            part_id,
            parent_id,
            prov_rep_id,
            year,
            col_id,
            row_desc
        } = req.validated?.query as {
            row_id: number | undefined,
            part_id: number | undefined,
            parent_id: number | undefined,
            prov_rep_id: string | undefined,
            year: number | undefined,
            col_id: number | undefined,
            row_desc: string | undefined
        }
        const data = await reportRowsService.getReportRows(
            {
                row_id: row_id,
                part_id: part_id,
                parent_id: parent_id,
                prov_rep_id: prov_rep_id,
                year: year, col_id: col_id,
                row_desc: row_desc
            }
        )
        const dataOut = addRowHelperColumns(data)
        res.status(200).json({ success: true, data: dataOut })
        return next
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error retrieving years' })
    }
}
export const upsertReportRows: RequestHandler = async (
    req: Request,
    res: Response,
    next
) => {
    try {

        const { rows } = req.body
        const data = await reportRowsService.UpsertReportRows(rows)
        const dataOut = addRowHelperColumns(data)
        res.status(200).json({ success: true, data: dataOut })
        return next
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error upserting data into database' })
    }
}

export const deleteReportRow: RequestHandler = async (
    req: Request,
    res: Response,
    next
) => {
    try {
        const { row_id } = req.validated?.params as { row_id: number }
        const data = await reportRowsService.deleteReportRows(row_id)
        res.status(200).json({ success: true, data: data })
        return next
    }
    catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error deleting data into database' })
    }
}
export const moveUp: RequestHandler = async (
    req: Request,
    res: Response,
    next
) => {
    try {

    } catch (err: any) {

    }

    const { part_id, row_id } = req.body

}
export const move: RequestHandler = async (
    req: Request,
    res: Response,
    next
) => {
    try {
        const { move } = req.validated?.body as { move: { part_id: number, row_id: number, move: 'up' | 'down' } }
        const data = await reportRowsService.moveReportRow(move.part_id, move.row_id, move.move)
        res.status(200).json({ success: true, data: data })
    } catch (err: any) {
        res.status(500).json({ success: false })
    }
}
export const newRow: RequestHandler = async (
    req:Request,
    res:Response,
    next
) => {
    try {
        const { part_id, row_desc ,parent_id
        } = req.validated?.body as { part_id: number, row_desc: string,parent_id:number|null|undefined }
        const data = await reportRowsService.newReportRow(part_id, row_desc,parent_id)
        res.status(200).json({ success: true, data: data })
        return next()
    } catch (err: any) {
        res.status(500).json({ success: false })
    }
}
export const changeDesc: RequestHandler = async () => {

}
export const changeParent: RequestHandler = async (
    req:Request,
    res:Response,
    next
) => {
    try {
        const { part_id, row_desc ,new_parent_id,row_id
        } = req.validated?.body as { part_id: number, row_desc: string,new_parent_id:number|null,row_id:number }
        const data = await reportRowsService.changeParentRow(part_id,row_desc,new_parent_id,row_id)
        res.status(200).json({ success: true, data: data })
        return next()
    } catch (err: any) {
        res.status(500).json({ success: false })
    }
}