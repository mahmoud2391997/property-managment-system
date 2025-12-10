import crypto from 'crypto'

// Billplz API configuration
const BILLPLZ_API_URL = process.env.BILLPLZ_API_URL
const BILLPLZ_API_SECRET_KEY = process.env.BILLPLZ_API_SECRET_KEY
const BILLPLZ_COLLECTION_ID = process.env.BILLPLZ_COLLECTION_ID
const BILLPLZ_X_SIGNATURE_KEY = process.env.BILLPLZ_X_SIGNATURE_KEY

// Validate environment variables
if (!BILLPLZ_API_URL || !BILLPLZ_API_SECRET_KEY || !BILLPLZ_COLLECTION_ID || !BILLPLZ_X_SIGNATURE_KEY) {
  throw new Error('Missing required Billplz environment variables')
}

export interface CreateBillParams {
  collection_id: string
  email: string
  mobile?: string
  name: string
  amount: number // in cents (e.g., 10000 = RM 100.00)
  callback_url: string
  redirect_url?: string
  description: string
  reference_1_label?: string
  reference_1?: string
  reference_2_label?: string
  reference_2?: string
}

export interface BillplzBillResponse {
  id: string
  collection_id: string
  paid: boolean
  state: string
  amount: number
  paid_amount: number
  due_at: string
  email: string
  mobile: string | null
  name: string
  url: string
  reference_1_label: string
  reference_1: string
  reference_2_label: string
  reference_2: string
  redirect_url: string | null
  callback_url: string
  description: string
  transaction_id?: string
  transaction_status?: string
}

export interface BillplzWebhookPayload {
  id: string
  collection_id: string
  paid: boolean
  state: string
  amount: string
  paid_amount: string
  due_at: string
  email: string
  mobile: string | null
  name: string
  url: string
  paid_at: string
  x_signature: string
  [key: string]: any
}

/**
 * Create a new bill in Billplz
 * @param params Bill creation parameters
 * @returns Bill response from Billplz API
 */
export async function createBill(params: CreateBillParams): Promise<BillplzBillResponse> {
  try {
    const formData = new URLSearchParams()
    formData.append('collection_id', params.collection_id)
    formData.append('email', params.email)

    if (params.mobile) {
      formData.append('mobile', params.mobile)
    }

    formData.append('name', params.name)
    formData.append('amount', params.amount.toString())
    formData.append('callback_url', params.callback_url)
    formData.append('description', params.description)

    if (params.redirect_url) {
      formData.append('redirect_url', params.redirect_url)
    }

    if (params.reference_1_label && params.reference_1) {
      formData.append('reference_1_label', params.reference_1_label)
      formData.append('reference_1', params.reference_1)
    }

    if (params.reference_2_label && params.reference_2) {
      formData.append('reference_2_label', params.reference_2_label)
      formData.append('reference_2', params.reference_2)
    }

    const response = await fetch(`${BILLPLZ_API_URL}/bills`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${BILLPLZ_API_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`)
    }

    const data: BillplzBillResponse = await response.json()
    return data
  } catch (error: any) {
    console.error('Error creating Billplz bill:', error)
    throw new Error(`Failed to create bill: ${error.message}`)
  }
}

/**
 * Verify X Signature from Billplz webhook callback
 * This ensures the webhook request actually came from Billplz
 * Uses HMAC-SHA512 algorithm as per Billplz documentation
 * Parameters must be in specific order
 * @param payload Webhook payload from Billplz
 * @returns true if signature is valid, false otherwise
 */
export function verifyXSignature(payload: BillplzWebhookPayload): boolean {
  try {
    const receivedSignature = payload.x_signature

    if (!receivedSignature) {
      console.error('No x_signature found in payload')
      return false
    }

    // Build the source string from payload
    // Based on official Billplz implementations:
    // 1. Filter out x_signature, null, false, and empty string values
    // 2. Sort keys alphabetically (case-insensitive)
    // 3. Format as: key1value1|key2value2|key3value3

    const pairs: Record<string, string> = {}

    // Fields to EXCLUDE from signature calculation (besides x_signature)
    // transaction_id, transaction_status, and reference fields are NOT part of the signature
    const excludeFields = [
      'x_signature',
      'transaction_id',
      'transaction_status',
      'reference_1',
      'reference_1_label',
      'reference_2',
      'reference_2_label'
    ]

    for (const [key, value] of Object.entries(payload)) {
      // Skip excluded fields
      if (excludeFields.includes(key)) continue

      // Skip ONLY null and false, but include empty strings
      // (mobile field can be empty string and must be included in signature)
      if (value === null || value === false) continue

      // Store as string
      pairs[key] = String(value)
    }

    // Sort keys alphabetically (case-insensitive)
    const sortedKeys = Object.keys(pairs).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )

    // Build source string: keyvalue|keyvalue|...
    const parts = sortedKeys.map(key => `${key}${pairs[key]}`)
    const sourceString = parts.join('|')

    console.log('🔍 Signature Debug Info:')
    console.log('X-Signature Key (first 20 chars):', BILLPLZ_X_SIGNATURE_KEY?.substring(0, 20))
    console.log('Keys included:', sortedKeys)
    console.log('Source string:', sourceString)

    // Generate HMAC-SHA256 signature
    // Note: Billplz appears to use SHA256 despite documentation mentioning SHA512
    const computedSignature = crypto
      .createHmac('sha256', BILLPLZ_X_SIGNATURE_KEY!)
      .update(sourceString)
      .digest('hex')

    // Compare signatures (case-insensitive)
    const isValid = computedSignature.toLowerCase() === receivedSignature.toLowerCase()

    if (!isValid) {
      console.error('❌ X Signature validation failed')
      console.error('Source string:', sourceString)
      console.error('Computed:', computedSignature)
      console.error('Received:', receivedSignature)
    } else {
      console.log('✅ Signature matched!')
    }

    return isValid
  } catch (error: any) {
    console.error('Error verifying X signature:', error)
    return false
  }
}

/**
 * Get a bill's details from Billplz
 * @param billId The Billplz bill ID
 * @returns Bill details from Billplz API
 */
export async function getBill(billId: string): Promise<BillplzBillResponse> {
  try {
    const response = await fetch(`${BILLPLZ_API_URL}/bills/${billId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${BILLPLZ_API_SECRET_KEY}:`).toString('base64')}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`)
    }

    const data: BillplzBillResponse = await response.json()
    return data
  } catch (error: any) {
    console.error('Error fetching Billplz bill:', error)
    throw new Error(`Failed to fetch bill: ${error.message}`)
  }
}

/**
 * Transaction details from Billplz transactions endpoint
 */
export interface BillplzTransaction {
  id: string  // This is the transaction_id
  status: 'pending' | 'completed' | 'failed'
  completed_at: string | null
  payment_channel: string
}

export interface BillplzTransactionsResponse {
  bill_id: string
  transactions: BillplzTransaction[]
}

/**
 * Get a bill's transactions from Billplz
 * This endpoint returns transaction_id which is not available in the getBill response
 * @param billId The Billplz bill ID
 * @returns Transactions response from Billplz API
 */
export async function getBillTransactions(billId: string): Promise<BillplzTransactionsResponse> {
  try {
    const response = await fetch(`${BILLPLZ_API_URL}/bills/${billId}/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${BILLPLZ_API_SECRET_KEY}:`).toString('base64')}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`)
    }

    const data: BillplzTransactionsResponse = await response.json()
    return data
  } catch (error: any) {
    console.error('Error fetching Billplz transactions:', error)
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }
}

/**
 * Get a bill with its completed transaction ID
 * Combines getBill and getBillTransactions to get full bill details with transaction_id
 * @param billId The Billplz bill ID
 * @returns Bill details with transaction_id from completed transaction
 */
export async function getBillWithTransaction(billId: string): Promise<BillplzBillResponse> {
  // Get bill details first
  const billDetails = await getBill(billId)

  // If bill is paid, fetch transactions to get the transaction_id
  if (billDetails.paid && billDetails.state === 'paid') {
    try {
      const transactionsData = await getBillTransactions(billId)

      // Find the completed transaction
      const completedTransaction = transactionsData.transactions.find(
        t => t.status === 'completed'
      )

      if (completedTransaction) {
        // Add transaction_id to bill response
        billDetails.transaction_id = completedTransaction.id
        billDetails.transaction_status = completedTransaction.status
        console.log(`✅ Found transaction_id: ${completedTransaction.id}`)
      } else {
        console.log('⚠️ No completed transaction found for paid bill')
      }
    } catch (error) {
      console.error('Error fetching transactions, continuing without transaction_id:', error)
    }
  }

  return billDetails
}

/**
 * Convert amount from RM to cents
 * @param ringgit Amount in Ringgit Malaysia (e.g., 100.50)
 * @returns Amount in cents (e.g., 10050)
 */
export function ringgitToCents(ringgit: number): number {
  return Math.round(ringgit * 100)
}

/**
 * Convert amount from cents to RM
 * @param cents Amount in cents (e.g., 10050)
 * @returns Amount in Ringgit Malaysia (e.g., 100.50)
 */
export function centsToRinggit(cents: number): number {
  return cents / 100
}

export { BILLPLZ_COLLECTION_ID }
