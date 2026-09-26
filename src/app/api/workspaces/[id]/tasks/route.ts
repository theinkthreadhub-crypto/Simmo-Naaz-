import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceTasks, createWorkspaceTask, updateWorkspaceTaskStatus, can } from '@/lib/db/workspace';
import { createClient } from '@/lib/supabase/server';

async function userId(){const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();return user?.id||null;}

export async function GET(_req:NextRequest,{params}:{params:{id:string}}){
  try{
    const uid=await userId();if(!uid)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(uid,'workspace.view',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    return NextResponse.json({tasks:await getWorkspaceTasks(params.id)});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}

export async function POST(req:NextRequest,{params}:{params:{id:string}}){
  try{
    const uid=await userId();if(!uid)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(uid,'tasks.create',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    const body=await req.json();
    if(!body.title?.trim())return NextResponse.json({error:'title is required'},{status:400});
    const task=await createWorkspaceTask({
      workspace_id:params.id,project_id:body.project_id||null,campaign_id:body.campaign_id||null,
      title:body.title.trim(),description:body.description||null,created_by:uid,assigned_to:body.assigned_to||null,
      priority:body.priority||'NORMAL',due_date:body.due_date||null,review_required:Boolean(body.review_required)
    });
    return NextResponse.json({task},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}

export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  try{
    const uid=await userId();if(!uid)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(uid,'tasks.complete',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    const body=await req.json();
    if(!body.taskId||!body.status)return NextResponse.json({error:'taskId and status are required'},{status:400});
    const task=await updateWorkspaceTaskStatus(body.taskId,body.status,uid,body.blockerReason);
    if(!task)return NextResponse.json({error:'TASK_NOT_FOUND'},{status:404});
    return NextResponse.json({task});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}
