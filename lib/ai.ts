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

const SYSTEM_PROMPT = `You are an expert Indian GST invoice parser for construction businesses.
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

  // Claude supports image/jpeg, image/png, image/gif, image/webp
  // For PDFs, we treat as image/jpeg if mimeType is application/pdf (needs pre-conversion)
  const claudeMediaType = mimeType === 'application/pdf'
    ? 'image/jpeg' // PDF must be rendered to image first; this is a best-effort fallback
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
            source: {
              type: 'base64',
              media_type: claudeMediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Extract all invoice/bill details from this document and return as JSON.',
          },
        ],
      },
    ],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : null
  if (!raw) throw new Error('Claude returned empty response')

  // Strip any markdown code fences if Claude accidentally added them
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  const parsed = JSON.parse(cleaned)
  const validated = ExtractedBillSchema.parse(parsed)
  return validated as ExtractedBillData
}

// Natural language → SQL for AI query feature
export async function nlToSql(
  query: string,
  ownerIds: string[]
): Promise<{ sql: string; explanation: string }> {
  const ownerFilter = ownerIds.map(id => `'${id}'`).join(', ')

  const client = getClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: `You convert natural language questions about a construction bill ledger to safe PostgreSQL SELECT queries.

Database tables (always filter by owner_id IN (${ownerFilter})):
- suppliers(id, owner_id, name, gst_number, category)
- bills(id, owner_id, supplier_id, invoice_number, invoice_date, due_date, total_amount, gst_amount, tds_amount, status)
- payments(id, owner_id, supplier_id, bill_id, amount, payment_date, mode)
- ledger_entries(id, owner_id, supplier_id, type, amount, running_balance, entry_date)

RULES:
- Only SELECT queries allowed — no INSERT, UPDATE, DELETE, DROP, etc.
- Always include owner_id IN (${ownerFilter}) in the WHERE clause
- Return ONLY valid JSON: { "sql": "...", "explanation": "..." }
- explanation should be a plain English summary of what the query does`,
    messages: [
      { role: 'user', content: query },
    ],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : null
  if (!raw) throw new Error('Claude returned empty response')

  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  const result = JSON.parse(cleaned) as { sql: string; explanation: string }

  // Safety: block any non-SELECT
  const upperSql = result.sql.trim().toUpperCase()
  if (!upperSql.startsWith('SELECT') || /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/.test(upperSql)) {
    throw new Error('Only SELECT queries are allowed')
  }

  return result
}
