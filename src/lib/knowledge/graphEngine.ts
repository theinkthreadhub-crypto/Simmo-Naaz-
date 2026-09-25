import { createClient } from '@/lib/supabase/server';

export type EntityType =
  | 'PERSON'
  | 'PROJECT'
  | 'BUSINESS'
  | 'GOAL'
  | 'SKILL'
  | 'QUEST'
  | 'HABIT'
  | 'ROUTINE'
  | 'DECISION'
  | 'TOPIC'
  | 'MEMORY';

export type ProvenanceType =
  | 'FACT'
  | 'USER_PREFERENCE'
  | 'USER_DECISION'
  | 'AI_INFERENCE'
  | 'SYSTEM_CALCULATION';

export type KnowledgeRelation =
  | 'OWNS'
  | 'WORKS_ON'
  | 'RELATED_TO'
  | 'DEPENDS_ON'
  | 'SUPPORTS'
  | 'REQUIRES_SKILL'
  | 'HAS_QUEST'
  | 'MENTIONED_IN';

export interface KnowledgeEntity {
  id: string;
  userId: string;
  entityType: EntityType;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  provenanceType: ProvenanceType;
  source: string;
  confidence: number;
  verifiedByUser: boolean;
  createdAt: string;
}

export interface KnowledgeEdge {
  id: string;
  userId: string;
  sourceId: string;
  targetId: string;
  relationType: KnowledgeRelation;
  confidence: number;
  metadata: Record<string, unknown>;
}

export async function createKnowledgeEntity(
  userId: string,
  entity: {
    entityType: EntityType;
    name: string;
    description?: string;
    properties?: Record<string, unknown>;
    provenanceType?: ProvenanceType;
    source?: string;
    confidence?: number;
    verifiedByUser?: boolean;
  }
): Promise<KnowledgeEntity> {
  const supabase = createClient();
  const id = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newEntity: KnowledgeEntity = {
    id,
    userId,
    entityType: entity.entityType,
    name: entity.name,
    description: entity.description || '',
    properties: entity.properties || {},
    provenanceType: entity.provenanceType || 'FACT',
    source: entity.source || 'USER_EXPLICIT',
    confidence: entity.confidence ?? 1.0,
    verifiedByUser: entity.verifiedByUser ?? true,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('knowledge_entities').insert({
      id,
      user_id: userId,
      entity_type: newEntity.entityType,
      name: newEntity.name,
      description: newEntity.description,
      properties: newEntity.properties,
      provenance_type: newEntity.provenanceType,
      source: newEntity.source,
      confidence: newEntity.confidence,
      verified_by_user: newEntity.verifiedByUser,
      created_at: newEntity.createdAt
    });
  } catch {
    // In-memory or test harness fallback
  }

  return newEntity;
}

export async function createKnowledgeEdge(
  userId: string,
  edge: {
    sourceId: string;
    targetId: string;
    relationType: KnowledgeRelation;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<KnowledgeEdge> {
  const supabase = createClient();
  const id = `edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newEdge: KnowledgeEdge = {
    id,
    userId,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    relationType: edge.relationType,
    confidence: edge.confidence ?? 1.0,
    metadata: edge.metadata || {}
  };

  try {
    await supabase.from('knowledge_edges').insert({
      id,
      user_id: userId,
      source_id: newEdge.sourceId,
      target_id: newEdge.targetId,
      relation_type: newEdge.relationType,
      confidence: newEdge.confidence,
      metadata: newEdge.metadata
    });
  } catch {
    // In-memory fallback
  }

  return newEdge;
}

export async function getEntityNeighborhood(userId: string, entityId: string): Promise<{
  entity: KnowledgeEntity | null;
  connections: Array<{ relation: KnowledgeRelation; connectedEntity: KnowledgeEntity }>;
}> {
  const supabase = createClient();

  try {
    const { data: ent } = await supabase
      .from('knowledge_entities')
      .select('*')
      .eq('id', entityId)
      .eq('user_id', userId)
      .single();

    if (!ent) return { entity: null, connections: [] };

    const { data: outEdges } = await supabase
      .from('knowledge_edges')
      .select('*, target:knowledge_entities!knowledge_edges_target_id_fkey(*)')
      .eq('source_id', entityId)
      .eq('user_id', userId);

    const connections = (outEdges || []).map((e: any) => ({
      relation: e.relation_type,
      connectedEntity: {
        id: e.target.id,
        userId: e.target.user_id,
        entityType: e.target.entity_type,
        name: e.target.name,
        description: e.target.description,
        properties: e.target.properties,
        provenanceType: e.target.provenance_type,
        source: e.target.source,
        confidence: e.target.confidence,
        verifiedByUser: e.target.verified_by_user,
        createdAt: e.target.created_at
      }
    }));

    return {
      entity: {
        id: ent.id,
        userId: ent.user_id,
        entityType: ent.entity_type,
        name: ent.name,
        description: ent.description,
        properties: ent.properties,
        provenanceType: ent.provenance_type,
        source: ent.source,
        confidence: ent.confidence,
        verifiedByUser: ent.verified_by_user,
        createdAt: ent.created_at
      },
      connections
    };
  } catch {
    return { entity: null, connections: [] };
  }
}
