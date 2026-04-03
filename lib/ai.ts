import Anthropic from '@anthropic-ai/sdk'
import { ExtractedBillData } from '@/types'
import { z } from 'zod'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })
}

const ExtractedBillSchema = z.object({
  supplier_name: z.string().nullable(),
  gst_number: z.string().nullable(),
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  due_date: z.string().nullable(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    rate: z.number().nullable(),
    amount: z.number().nullable(),
    gst_rate: z.number().nullable(),
  })).default([]),
  taxable_amount: z.number().nullable(),
  cgst_amount: z.number().nullable(),
  sgst_amount: z.number().nullable(),
  igst_amount: z.number().nullable(),
  gst_amount: z.number().nullable(),
  total_amount: z.number().nullable(),
  tds_applicable: z.boolean().default(false),
  tds_rate: z.number().nullable(),
  tds_amount: z.number().nullable(),
  confidence: z.enum(['high', 'medium', 'low']).default('medium'),
})

const SYSTEM_PROMPT = `You are an expert Indian GST invoice parser.
Extract all bill/invoice details from the provided image and return ONLY a valid JSON object — no markdown, no explanation.

Rules:
- All amounts in INR as plain numbers (no currency symbols or commas)
- Dates in YYYY-MM-DD format
- GST number format: 22AAAAA0000A1Z5 (15 alphanumeric chars)
- If IGST is present → CGST and SGST should be 0 (inter-state supply)
- If CGST + SGST present → IGST is 0 (intra-state supply)
- TDS is applicable if explicitly mentioned on the bill
- confidence: "high" = all key fields found, "medium" = some missing, "low" = very unclear image
- Use null for any field you cannot clearly read — never guess amounts

Required JSON structure:
{
  "supplier_name": string | null,
  "gst_number": string | null,
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "line_items": [{ "description": string, "quantity": number|null, "unit": string|null, "rate": number|null, "amount": number|null, "gst_rate": number|null }],
  "taxable_amount": number | null,
  "cgst_amount": number | null,
  "sgst_amount": number | null,
  "igst_amount": number | null,
  "gst_amount": number | null,
  "total_amount": number | null,
  "tds_applicable": boolean,
  "tds_rate": number | null,
  "tds_amount": number | null,
  "confidence": "high" | "medium" | "low"
}`

export async function extractBillData(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExtractedBillData> {
  const client = getClient()
  const base64 = fileBuffer.toString('base64')

  const claudeMediaType = mimeType === 'application/pdf'
    ? 'image/jpeg'
    : (mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: claudeMediaType, data: base64 },
          },
          { type: 'text', text: 'Extract all invoice/bill details from this document and return as JSON.' },
        ],
      },
    ],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : null
  if (!raw) throw new Error('Claude returned empty response')

  // Strip markdown fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  // Safe JSON parse with meaningful error
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Claude returned malformed JSON — please retry or upload a clearer image')
  }

  // Validate structure with Zod — reject hallucinated/wrong-shape responses
  const result = ExtractedBillSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error('Claude response failed validation — please retry')
  }

  return result.data as ExtractedBillData
}

// Safe UUID validator — prevent prompt injection via ownerIds
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function nlToSql(
  query: string,
  ownerIds: string[]
): Promise<{ sql: string; explanation: string }> {
  // Validate all ownerIds are real UUIDs before embedding in prompt
  const safeOwnerIds = ownerIds.filter(id => UUID_REGEX.test(id))
  if (safeOwnerIds.length === 0) throw new Error('No valid owner IDs')

  const ownerFilter = safeOwnerIds.map(id => `'${id}'`).join(', ')

  const client = getClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: `You convert natural language questions about a bill ledger to safe PostgreSQL SELECT queries.

Database tables (always filter by owner_id IN (${ownerFilter})):
- suppliers(id, owner_id, name, gst_number, category)
- bills(id, owner_id, supplier_id, invoice_number, invoice_date, due_date, total_amount, gst_amount, tds_amount, status)
- payments(id, owner_id, supplier_id, bill_id, amount, payment_date, mode)
- ledger_entries(id, owner_id, supplier_id, type, amount, running_balance, entry_date)

RULES:
- Only SELECT queries — no INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, GRANT, REVOKE, EXECUTE, COPY
- Always include owner_id IN (${ownerFilter}) in the WHERE clause
- Maximum LIMIT 500 rows
- Return ONLY valid JSON: { "sql": "...", "explanation": "..." }
- explanation should be a plain English summary of what the query does`,
    messages: [{ role: 'user', content: query }],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : null
  if (!raw) throw new Error('Claude returned empty response')

  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  let result: { sql: string; explanation: string }
  try {
    result = JSON.parse(cleaned) as { sql: string; explanation: string }
  } catch {
    throw new Error('Claude returned malformed JSON for query')
  }

  if (!result.sql || typeof result.sql !== 'string') {
    throw new Error('Claude did not return a valid SQL query')
  }

  // Strict safety check — block any mutation or dangerous statements
  const upperSql = result.sql.trim().toUpperCase()
  const FORBIDDEN = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY|CREATE|REPLACE|DO)\b/
  if (!upperSql.startsWith('SELECT') || FORBIDDEN.test(upperSql)) {
    throw new Error('Only SELECT queries are allowed')
  }

  // Ensure ownerIds are present in the query
  const hasOwnerFilter = safeOwnerIds.some(id => result.sql.includes(id))
  if (!hasOwnerFilter) {
    throw new Error('Generated query is missing owner_id filter — blocked for security')
  }

  return result
}
