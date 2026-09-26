import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceMembers, updateMemberRole, removeWorkspaceMember, can } from '@/lib/db/workspace';
import { createClient } from '@/lib/supabase/server';

async function currentUserId(){const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();return user?.id||null;}

export async function GET(_req:NextRequest,{params}:{params:{id:string}}){
  try{
    const userId=await currentUserId();if(!userId)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(userId,'members.view',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    return NextResponse.json({members:await getWorkspaceMembers(params.id)});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}

export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  try{
    const userId=await currentUserId();if(!userId)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(userId,'members.manage',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    const body=await req.json();
    if(!body.targetUserId||!body.newRole)return NextResponse.json({error:'targetUserId and newRole are required'},{status:400});
    const success=await updateMemberRole(params.id,body.targetUserId,body.newRole,userId);
    if(!success)return NextResponse.json({error:'MEMBER_NOT_FOUND'},{status:404});
    return NextResponse.json({success:true});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}

export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  try{
    const userId=await currentUserId();if(!userId)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    if(!(await can(userId,'members.manage',params.id)))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    const body=await req.json();
    if(!body.targetUserId)return NextResponse.json({error:'targetUserId is required'},{status:400});
    const success=await removeWorkspaceMember(params.id,body.targetUserId,userId);
    if(!success)return NextResponse.json({error:'MEMBER_NOT_FOUND'},{status:404});
    return NextResponse.json({success:true});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});}
}
