import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, can } from '@/lib/db/workspace';
import { createClient } from '@/lib/supabase/server';

export async function POST(req:NextRequest,{params}:{params:{id:string}}){
  try{
    const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(user.id,'members.invite',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    const body=await req.json();
    if(!body.email?.trim()||!body.role)return NextResponse.json({error:'email and role are required'},{status:400});
    const invitation=await createInvitation({
      workspace_id:params.id,email:body.email.trim(),role:body.role,invited_by:user.id,expiresInDays:body.expiresInDays
    });
    return NextResponse.json({invitation},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}
