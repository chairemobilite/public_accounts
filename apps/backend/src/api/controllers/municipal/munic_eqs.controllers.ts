import { RequestHandler,Request, Response} from "express"
import { municEqsService } from "../../services/municipal/municipal_eqs.services"

export const getEquations: RequestHandler = async (
    req: Request,
    res: Response,
    next) => {
    try {
        const {
            eq_id,
        } = req.validated?.query as { eq_id: number}
        const data = await municEqsService.getEquationsService({eq_id:eq_id})
        res.status(200).json({ success: true, data: data })
        return next()
    } catch (err: any) {
        console.log(err)
        res.status(500).json({ success: false, message: 'error retrieving equations' })
    }
}

export const getVariables:RequestHandler=async(req:Request,res:Response,next)=>{
    try{
        const {
            eq_id,
        } = req.validated?.query as { eq_id: number}
        const data = await municEqsService.getVariablesService({eq_id:eq_id})
        res.status(200).json({ success: true, data: data })
        return next()
    }catch(err:any){
        console.log(err)
        res.status(500).json({success:false,message:'error getting equation variables'})
    }
}

export const getResults:RequestHandler=async(req:Request,res:Response,next)=>{
    try {
        const {
            eq_id,
            jur_type,
            jur_id,
            year,
            capitation
        }=req.validated?.query as {
            eq_id:number,
            jur_type:'cm'|'mrc'|'reg'|'mun',
            jur_id:string|number,
            year:number,
            capitation:boolean
        }
        const data= await municEqsService.getEquationResults({
            eq_id:eq_id,
            jur_type:jur_type,
            jur_id:jur_id,
            year:year,
            capitation:capitation
        })
        res.status(200).json({success:false,data:data})
        return next()
    } catch (error:any) {
        console.log(error)
        res.status(500).json({success:false,message:'error getting equation results'})
    }
}

export const createEquation:RequestHandler=async(req:Request,res:Response,next)=>{
    try{
        const {eq_name,eq_expression}=req.validated?.body as {eq_name:string,eq_expression:string}
        const data = await municEqsService.createEquation(eq_name,eq_expression)
        res.status(200).json({success:true,data:data})
        return next()
    }catch(err:any){
        console.log(err)
        res.status(500).json({success:false,message:'error creating equation '})
    }
}

export const updateEquation:RequestHandler=async(req:Request,res:Response,next)=>{
    try{

        const {eq_id}=req.validated?.params as {eq_id:number}
        const {eq_name,eq_expression}=req.validated?.body as {eq_name:string,eq_expression:string}
        const data = await municEqsService.updateEquation(eq_id,eq_name,eq_expression)
        res.status(200).json({success:true,data:data})
        return next()
    }catch(err:any){
        console.log(err)
        res.status(500).json({success:false,message:'error updating equation '})
    }
}

export const createVariable:RequestHandler=async(req:Request,res:Response,next)=>{
    try{
        const {
            eq_id,
            eq_var_symbol,
            part_id,
            row_id,
            col_id
        }=req.validated?.body as {
            eq_id:number,
            eq_var_symbol:string,
            part_id:number,
            row_id:number,
            col_id:number
        }
        const data = await municEqsService.createEquationVar(eq_var_symbol,eq_id,part_id,row_id,col_id)
        res.status(200).json({success:true,data:data})
        return next()
    }catch(err:any){
        console.log(err)
        res.status(500).json({success:false,message:'error creating variable '})
    }
}

export const updateVariable:RequestHandler=async(req:Request,res:Response,next)=>{
    try{
        const {
            eq_id,
            eq_var_symbol,
            part_id,
            row_id,
            col_id
        }=req.validated?.body as {
            eq_id:number,
            eq_var_symbol:string,
            part_id:number,
            row_id:number,
            col_id:number
        }
        const {eq_var_id}=req.validated?.params as {eq_var_id:number}
        const data = await municEqsService.updateEquationVar(eq_var_id,eq_var_symbol,eq_id,part_id,row_id,col_id)
        res.status(200).json({success:true,data:data})
        return next()
    }catch(err:any){
        console.log(err)
        res.status(500).json({success:false,message:'error updating variable '})
    }
}

export const deleteVariable:RequestHandler=async(req:Request,res:Response,next)=>{
    try{
        const{eq_var_id}=req.validated?.params as {eq_var_id:number}
        const data = await municEqsService.deleteEquationVar(eq_var_id)
        res.status(200).json({success:true,data:data })
        return next()
    }catch(err:any){
        console.log(err)
        res.status(500).json({success:false,message:'error deleting variable '})
    }
}


export const deleteEquation:RequestHandler=async(req:Request,res:Response,next)=>{
    try{
        const{eq_id}=req.validated?.params as {eq_id:number}
        const data = await municEqsService.deleteEquation(eq_id)
        res.status(200).json({success:true,data:data })
        return next()
    }catch(err:any){
        console.log(err)
        res.status(500).json({success:false,message:'error deleting equation '})
    }
}