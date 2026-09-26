import { supabase } from '@/lib/supabase/client';
import { MentraAgent, AgentApproval } from '@/types/mentra';

// Production agent cards must come from persisted runtime state. Static
// definitions previously claimed fake READY states, tasks and accuracy figures.
export const systemAgentDefinitions: MentraAgent[] = [];

export async function getUserAgentApprovals(userId:string):Promise<AgentApproval[]>{
  const {data,error}=await supabase.from('agent_approvals').select('*').eq('user_id',userId).eq('status','PENDING');
  if(error)throw new Error(error.message);
  return(data||[]) as AgentApproval[];
}

export async function approveAgentAction(userId:string,approvalId:string):Promise<boolean>{
  const {error}=await supabase.from('agent_approvals').update({status:'APPROVED'}).eq('id',approvalId).eq('user_id',userId).eq('status','PENDING');
  if(error)throw new Error(error.message);
  return true;
}
