'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Brain, 
  Lock, 
  Building2, 
  Plus, 
  Activity, 
  Settings,
  ChevronRight,
  Send
} from 'lucide-react';
import { WorkspaceRole } from '@/lib/workspace/rbac';

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joined: string;
  avatar: string;
}

interface TaskItem {
  id: string;
  title: string;
  assignedTo: string;
  role: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'LAUNCH_CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'COMPLETE';
  dueDate: string;
}

export default function WorkspaceSettingsPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'tasks' | 'policies' | 'memories' | 'audit'>('members');
  const [activeWorkspace, setActiveWorkspace] = useState<'business' | 'personal'>('business');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('EDITOR');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [members, setMembers] = useState<MemberItem[]>([
    {
      id: 'usr_1',
      name: 'Naaz (You)',
      email: 'operator@inkthreadhub.com',
      role: 'OWNER',
      status: 'ACTIVE',
      joined: 'Sep 2026',
      avatar: '👑',
    },
    {
      id: 'usr_2',
      name: 'Aarav Sharma',
      email: 'aarav@inkthreadhub.com',
      role: 'MANAGER',
      status: 'ACTIVE',
      joined: 'Sep 2026',
      avatar: '👔',
    },
    {
      id: 'usr_3',
      name: 'Riya Patel',
      email: 'riya.creator@inkthreadhub.com',
      role: 'EDITOR',
      status: 'ACTIVE',
      joined: 'Sep 2026',
      avatar: '🎨',
    },
    {
      id: 'usr_4',
      name: 'Devika Ray',
      email: 'devika.audit@investors.com',
      role: 'VIEWER',
      status: 'ACTIVE',
      joined: 'Sep 2026',
      avatar: '👁️',
    },
  ]);

  const tasks: TaskItem[] = [
    {
      id: 't1',
      title: 'Shoot 3 Drop-Shoulder Oversized Tee Reels',
      assignedTo: 'Riya Patel',
      role: 'Editor / Creator',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: 'Friday, Oct 2',
    },
    {
      id: 't2',
      title: 'Review ₹5000 Meta Ad Creative Variations',
      assignedTo: 'Aarav Sharma',
      role: 'Manager',
      priority: 'LAUNCH_CRITICAL',
      status: 'REVIEW',
      dueDate: 'Thursday, Oct 1',
    },
    {
      id: 't3',
      title: 'Catalog Price Audit & Margin Verification (₹599 Target)',
      assignedTo: 'Naaz',
      role: 'Owner',
      priority: 'NORMAL',
      status: 'COMPLETE',
      dueDate: 'Wednesday, Sep 30',
    },
  ];

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember: MemberItem = {
      id: `usr_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'INVITED',
      joined: 'Pending acceptance',
      avatar: '✉️',
    };

    setMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 4000);
  };

  const handleRoleChange = (userId: string, newRole: WorkspaceRole) => {
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
  };

  const handleRemoveMember = (userId: string) => {
    setMembers(prev => prev.filter(m => m.id !== userId));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 pt-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Workspace Switcher Context */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Phase 13 Active
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Lock className="h-3 w-3 text-emerald-400" />
                Zero-Leak Privacy Isolation
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2">
              <Building2 className="h-7 w-7 text-cyan-500" />
              Team & Collaboration Workspace
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Multi-tenant permission engine, task delegation, and shared business operations.
            </p>
          </div>

          {/* Workspace Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-black/60 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setActiveWorkspace('business')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeWorkspace === 'business'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4" />
              InkThread Hub (Business)
            </button>
            <button
              onClick={() => setActiveWorkspace('personal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeWorkspace === 'personal'
                  ? 'bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Lock className="h-4 w-4 text-emerald-400" />
              Personal (Private)
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
          {[
            { id: 'members', label: 'Team Members & RBAC', icon: Users },
            { id: 'tasks', label: 'Delegated Tasks', icon: Clock },
            { id: 'policies', label: 'Approval Chains', icon: ShieldCheck },
            { id: 'memories', label: 'Business Memory Vault', icon: Brain },
            { id: 'audit', label: 'Audit Trail', icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MEMBERS & RBAC */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Invite New Member */}
            <div className="p-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-400" />
                Invite Team Member
              </h2>
              <p className="text-xs text-zinc-400">
                Send a secure single-use invitation token. Personal journal, private memory, and individual finances remain strictly invisible.
              </p>

              <form onSubmit={handleSendInvite} className="flex flex-col md:flex-row gap-3 pt-2">
                <input
                  type="email"
                  placeholder="colleague@inkthreadhub.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as WorkspaceRole)}
                  className="px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ADMIN">Admin (Workspace & Agent Config)</option>
                  <option value="MANAGER">Manager (Projects, Campaigns, Approvals)</option>
                  <option value="EDITOR">Editor (Content, Creative Briefs, Tasks)</option>
                  <option value="MEMBER">Member (Task Completion, Comments)</option>
                  <option value="VIEWER">Viewer (Read-Only Access)</option>
                </select>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all shadow-md shadow-cyan-500/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Invitation
                </button>
              </form>

              {inviteSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Invitation token created and dispatched securely.
                </div>
              )}
            </div>

            {/* Members List Table */}
            <div className="p-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center justify-between">
                <span>Active Workspace Members ({members.length})</span>
                <span className="text-xs font-normal text-zinc-400">Scoped to InkThread Hub</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-zinc-500 font-mono uppercase tracking-wider">
                      <th className="pb-3 font-medium">Member</th>
                      <th className="pb-3 font-medium">Assigned Role</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {members.map(member => (
                      <tr key={member.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-3.5 flex items-center gap-3">
                          <span className="text-lg p-2 rounded-xl bg-black/40 border border-zinc-800">{member.avatar}</span>
                          <div>
                            <p className="font-semibold text-zinc-200">{member.name}</p>
                            <p className="text-[11px] text-zinc-500 font-mono">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5">
                          {member.role === 'OWNER' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              👑 OWNER
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={e => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                              className="px-2.5 py-1 rounded-lg bg-black/60 border border-zinc-800 text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="EDITOR">EDITOR</option>
                              <option value="MEMBER">MEMBER</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            member.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-400 font-mono">{member.joined}</td>
                        <td className="py-3.5 text-right">
                          {member.role !== 'OWNER' && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS & DELEGATION */}
        {activeTab === 'tasks' && (
          <div className="p-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  Team Workload & Task Delegation
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Assign business campaigns and creative production tasks with transparent SLAs.
                </p>
              </div>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 transition-all">
                <Plus className="h-3.5 w-3.5" />
                Assign Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tasks.map(task => (
                <div key={task.id} className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      task.priority === 'LAUNCH_CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : task.priority === 'HIGH'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">{task.dueDate}</span>
                  </div>

                  <h3 className="font-semibold text-sm text-zinc-200">{task.title}</h3>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-mono">Assigned To</p>
                      <p className="text-zinc-300 font-medium">{task.assignedTo}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold ${
                      task.status === 'COMPLETE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : task.status === 'REVIEW'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: APPROVAL CHAINS */}
        {activeTab === 'policies' && (
          <div className="p-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
                Action Approval Policies & Governance Matrix
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Enforce version-safe approvals. Post edits immediately invalidate previous approvals to prevent unapproved external changes.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { action: 'Instagram / Social Post Publishing', minRole: 'MANAGER', review: 'Required before API dispatch', status: 'Active' },
                { action: 'Paid Ad Budget Modification (> ₹1000)', minRole: 'OWNER', review: 'Strict Owner Signoff', status: 'Active' },
                { action: 'E-commerce Catalog & Price Updates', minRole: 'MANAGER', review: 'Requires preview verification', status: 'Active' },
                { action: 'AI Deep Market Research Execution', minRole: 'EDITOR', review: 'Self-serve permitted', status: 'Active' },
              ].map((policy, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">{policy.action}</h3>
                    <p className="text-xs text-zinc-500">{policy.review}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Min: {policy.minRole}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {policy.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: WORKSPACE MEMORY VAULT */}
        {activeTab === 'memories' && (
          <div className="p-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-400" />
                Shared Business Knowledge Vault
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Persistent business learnings, supplier lead times, and campaign takeaways. Strictly isolated from personal private journals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  category: 'SUPPLIER_CONTEXT',
                  title: 'Surat Knits Lead Time',
                  content: 'Supplier requires approved print vectors minimum 3 business days before production kickoff.',
                  source: 'Supplier Call Log',
                },
                {
                  category: 'CAMPAIGN_LEARNING',
                  title: 'Micro-Text Streetwear Hooks',
                  content: 'Short 2-line Hindi typography hooks generated 3.4x higher reel retention than long text overlays.',
                  source: 'Drop 1 Analytics',
                },
                {
                  category: 'BUSINESS_DECISION',
                  title: '₹599 Launch Pricing Floor',
                  content: 'Selling price locked at ₹599 to maintain 63% gross margin against ₹220 production cost.',
                  source: 'Owner Signoff',
                },
                {
                  category: 'POLICY',
                  title: 'Brand Tone Standards',
                  content: 'Always maintain raw Delhi/Mumbai underground streetwear vibe. Avoid generic corporate slogans.',
                  source: 'Brand Guide v1',
                },
              ].map((mem, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {mem.category}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{mem.source}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-200">{mem.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{mem.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="p-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Immutable Activity & Security Audit Trail
            </h2>
            <p className="text-xs text-zinc-400">
              Complete record of all team mutations, role adjustments, and approved asset publishes.
            </p>

            <div className="space-y-2.5 pt-2">
              {[
                { time: '10 mins ago', actor: 'Naaz (Owner)', action: 'Approved Reel Creative Brief for Drop 1', tag: 'APPROVAL' },
                { time: '1 hour ago', actor: 'Aarav Sharma (Manager)', action: 'Assigned 3 Reel Tasks to Riya Patel', tag: 'DELEGATION' },
                { time: '3 hours ago', actor: 'Naaz (Owner)', action: 'Invited Devika Ray as Viewer', tag: 'MEMBERSHIP' },
                { time: 'Yesterday', actor: 'Riya Patel (Editor)', action: 'Submitted Caption v2 for Review', tag: 'CONTENT' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-500 text-[11px]">{item.time}</span>
                    <span className="font-semibold text-zinc-200">{item.actor}</span>
                    <span className="text-zinc-400">{item.action}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-cyan-400">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
