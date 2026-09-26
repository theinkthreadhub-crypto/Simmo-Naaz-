import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation } from '@/lib/db/workspace';
import { createClient } from '@/lib/supabase/server';

export async function POST(req:NextRequest){
  try{
    const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    const body=await req.json();
    if(!body.token)return NextResponse.json({error:'token is required'},{status:400});
    const result=await acceptInvitation(body.token,user.id);
    if(!result.success)return NextResponse.json({error:result.error},{status:400});
    return NextResponse.json({success:true,workspace_id:result.workspace_id});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}
