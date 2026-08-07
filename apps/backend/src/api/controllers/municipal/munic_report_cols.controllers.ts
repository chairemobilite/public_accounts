import { Request, RequestHandler, Response, Router } from 'express'
import { reportColsService } from '../../services/municipal/municipal_report_cols.services'
import { FinStateSectionCol, FinStateSectionRow } from '@budgets_municipaux/common'


export const getReportCols: RequestHandler = async (
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
            column_desc
        } = req.validated?.query as { row_id: number, part_id: number, parent_id: number, prov_rep_id: string, year: number, col_id: number, column_desc: string }
        const data = await reportColsService.getReportCols({
            row_id: row_id,
            part_id: part_id,
            parent_id: parent_id,
            prov_rep_id: prov_rep_id,
            year: year,
            col_id: col_id,
            column_desc: column_desc
        })
        res.status(200).json({ success: true, data: data })
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error retrieving years' })
    }
}
export const upsertReportCols: RequestHandler = async (
    req: Request,
    res: Response,
    next
) => {
    try {
        const { cols } = req.validated?.body as { cols: FinStateSectionCol[] }
        const data = await reportColsService.UpsertReportCols(cols)
        res.status(200).json({ success: true, data: data })
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error upserting data into database' })
    }
}

export const deleteReportCol: RequestHandler = async (
    req: Request,
    res: Response,
    next
) => {
    try {
        const { col_id } = req.validated?.params as { col_id: number }
        if (!col_id) {
            throw new Error('error pullin col id from validated')
        }

        const data = await reportColsService.deleteReportCols(col_id)
        res.status(200).json({ success: true, data: data })
        next()
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error upserting data into database' })
    }
}

export const moveCol: RequestHandler = async (
    req: Request,
    res: Response,
    next
) => {
    try {
        const { move } = req.validated?.body as { move: { part_id: number, col_id: number, move: 'left' | 'right' } }
        const data = await reportColsService.moveReportCol(move.part_id, move.col_id, move.move)
        res.status(200).json({ success: true, data: data })
    } catch (err: any) {
        res.status(500).json({ success: false })
    }
}

export const newCol: RequestHandler = async (
    req:Request,
    res: Response,
    next
) => {
    try {
        const { part_id,column_desc } = req.validated?.body as { part_id: number, column_desc:string }
        const data = await reportColsService.newReportCol(part_id, column_desc)
        res.status(200).json({ success: true, data: data })
        return next()
    } catch (err: any) {
        res.status(500).json({ success: false })
    }
}
export const changeDesc: RequestHandler = async () => {

}