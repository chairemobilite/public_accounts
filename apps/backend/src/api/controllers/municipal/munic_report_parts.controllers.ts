    import { Request, RequestHandler, Response, Router } from 'express'
import { reportPartsService } from '../../services/municipal/municipal_report_parts.services'
    
    export const getReportParts:RequestHandler=async(
        req:Request,
        res:Response,
        next)=>{
            try{
                const data = await reportPartsService.getReportParts()
                res.status(200).json({success:true,data:data})
            }catch(err:any){
                console.log(err)
                res.status(500).json({success:false,message:'error retrieving years'})
            }
    }
    export const createReportPart:RequestHandler=async(
        req:Request, 
        res:Response,
        next
    )=>{
        try{

            const {part_desc,part_page_def}=req.body
            const data =await reportPartsService.createReportPart(part_desc,part_page_def)
            res.status(200).json({success:true,data:data})
        }catch(err:any){
            console.log(err)
            res.status(500).json({success:false,message:'error retrieving years'})
        }
    }

     export const deleteReportParts:RequestHandler=async(
        req:Request, 
        res:Response,
        next
    )=>{
        try{

            const {part_id,}=req.validated?.params as {part_id:number}
            const data =await reportPartsService.deleteReportPart(part_id)
            res.status(200).json({success:true,data:data})
        }catch(err:any){
            console.log(err)
            res.status(500).json({success:false,message:'error retrieving years'})
        }
    }
    export const modifyReportPart:RequestHandler=async(req:Request,res:Response,next)=>{
        try{

            const {part_id}=req.validated?.params as {part_id:number}
            const {part_desc,part_page_def}=req.validated?.body as {part_desc:string,part_page_def:string}
            const data = await reportPartsService.modifyReportPart(part_id,part_desc,part_page_def)
            return res.status(200).json({success:true,data:data})
        }catch(err:any){
            console.log(err)
            const {part_id}=req.validated?.query as {part_id:number}
            res.status(500).json({success:false,message:`Error when updating report page with part_id: ${part_id}`})
        }
    }

