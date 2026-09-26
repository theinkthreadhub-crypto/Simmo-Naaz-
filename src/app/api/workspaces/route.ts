import { NextRequest, NextResponse } from 'next/server';
import { createWorkspace, getUserWorkspaces } from '@/lib/db/workspace';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
    const workspaces=await getUserWorkspaces(user.id);
    return NextResponse.json({workspaces});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});

    const body=await req.json();
    if(!body.name?.trim()||!body.type)return NextResponse.json({error:'name and type are required'},{status:400});

    const workspace=await createWorkspace({
      name:body.name.trim(),
      type:body.type,
      owner_id:user.id,
      business_id:body.business_id||null
    });
    return NextResponse.json({workspace},{status:201});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:500});
  }
}
