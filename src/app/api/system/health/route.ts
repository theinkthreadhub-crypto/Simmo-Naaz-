import { NextResponse } from 'next/server';
import { auditEnvironment } from '@/lib/config/envValidator';
import { getAllCircuitStates } from '@/lib/safety/circuitBreaker';

export async function GET() {
  const envAudit = auditEnvironment();
  const circuits = getAllCircuitStates();

  return NextResponse.json({
    status: envAudit.isValidCore ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: envAudit.environment,
    capabilities: envAudit.capabilities,
    circuits,
    summary: envAudit.summary
  });
}
