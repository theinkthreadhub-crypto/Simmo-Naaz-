import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceActivity, can } from '@/lib/db/workspace';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req:NextRequest,{params}:{params:{id:string}}){
  try{
    const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(user.id,'workspace.view',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    return NextResponse.json({activity:await getWorkspaceActivity(params.id)});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}
