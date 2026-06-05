/**
 * Yandex Direct API v5 client (server-only).
 *
 * Designed for VPS deployment: all credentials come from environment variables
 * and are never exposed to the client. Defaults to the Yandex sandbox so the
 * admin panel works safely in a test environment without touching real money.
 *
 * Env vars:
 *  - YANDEX_DIRECT_TOKEN         OAuth token (required to perform real calls)
 *  - YANDEX_DIRECT_API_URL       Base URL, defaults to the sandbox endpoint
 *  - YANDEX_DIRECT_CLIENT_LOGIN  Optional, required only for agency accounts
 *  - YANDEX_DIRECT_LANGUAGE      Accept-Language for messages, defaults to "ru"
 */

const SANDBOX_URL = 'https://api-sandbox.direct.yandex.com/json/v5'
const PRODUCTION_URL = 'https://api.direct.yandex.com/json/v5'

function getApiUrl(): string {
  const url = process.env.YANDEX_DIRECT_API_URL?.trim()
  if (url) return url.replace(/\/+$/, '')
  return SANDBOX_URL
}

const TOKEN = process.env.YANDEX_DIRECT_TOKEN?.trim()
const CLIENT_LOGIN = process.env.YANDEX_DIRECT_CLIENT_LOGIN?.trim()
const LANGUAGE = process.env.YANDEX_DIRECT_LANGUAGE?.trim() || 'ru'

export type YandexDirectMode = 'sandbox' | 'production'

export interface YandexDirectConfigStatus {
  configured: boolean
  mode: YandexDirectMode
  apiUrl: string
  hasClientLogin: boolean
}

export function getConfigStatus(): YandexDirectConfigStatus {
  const apiUrl = getApiUrl()
  return {
    configured: Boolean(TOKEN),
    mode: apiUrl.includes('sandbox') ? 'sandbox' : 'production',
    apiUrl,
    hasClientLogin: Boolean(CLIENT_LOGIN),
  }
}

export class YandexDirectError extends Error {
  code: number
  details?: string
  requestId?: string

  constructor(message: string, code = -1, details?: string, requestId?: string) {
    super(message)
    this.name = 'YandexDirectError'
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

interface ApiResponse<T> {
  result?: T
  error?: {
    error_code: number
    error_string: string
    error_detail?: string
    request_id?: string
  }
}

/**
 * Low-level call to a Yandex Direct API v5 service.
 */
async function callService<T>(
  service: string,
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  if (!TOKEN) {
    throw new YandexDirectError(
      'Yandex Direct не настроен: переменная окружения YANDEX_DIRECT_TOKEN не задана',
      0
    )
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${TOKEN}`,
    'Accept-Language': LANGUAGE,
    'Content-Type': 'application/json; charset=utf-8',
  }
  if (CLIENT_LOGIN) {
    headers['Client-Login'] = CLIENT_LOGIN
  }

  let response: Response
  try {
    response = await fetch(`${getApiUrl()}/${service}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ method, params }),
      // Direct API can be slow; keep a sane timeout via AbortController.
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new YandexDirectError('Превышено время ожидания ответа Yandex Direct', -2)
    }
    throw new YandexDirectError(
      `Ошибка сети при обращении к Yandex Direct: ${err instanceof Error ? err.message : 'unknown'}`,
      -3
    )
  }

  let data: ApiResponse<T> | null = null
  try {
    data = (await response.json()) as ApiResponse<T>
  } catch {
    throw new YandexDirectError(
      `Некорректный ответ Yandex Direct (HTTP ${response.status})`,
      response.status
    )
  }

  if (data?.error) {
    throw new YandexDirectError(
      data.error.error_string || 'Ошибка Yandex Direct API',
      data.error.error_code,
      data.error.error_detail,
      data.error.request_id
    )
  }

  if (!response.ok) {
    throw new YandexDirectError(`Yandex Direct вернул HTTP ${response.status}`, response.status)
  }

  if (data?.result === undefined) {
    throw new YandexDirectError('Пустой ответ Yandex Direct API', response.status)
  }

  return data.result
}

// ----- Domain types -----

export type CampaignState = 'ON' | 'OFF' | 'SUSPENDED' | 'ENDED' | 'CONVERTED' | 'ARCHIVED' | 'UNKNOWN'
export type CampaignStatus = 'ACCEPTED' | 'DRAFT' | 'MODERATION' | 'REJECTED' | 'UNKNOWN'

export interface Campaign {
  Id: number
  Name: string
  State: CampaignState
  Status: CampaignStatus
  StatusClarification?: string
  Type?: string
  StartDate?: string
  EndDate?: string
  DailyBudget?: { Amount: number; Mode: string }
  Funds?: {
    Mode?: string
    CampaignFunds?: { Balance?: number; BalanceBonus?: number; SumAvailableForTransfer?: number }
  }
}

export type CampaignAction = 'suspend' | 'resume' | 'archive' | 'unarchive' | 'delete'

interface ActionResultItem {
  Id?: number
  Warnings?: { Code: number; Message: string; Details?: string }[]
  Errors?: { Code: number; Message: string; Details?: string }[]
}

const CAMPAIGN_FIELDS = [
  'Id',
  'Name',
  'State',
  'Status',
  'StatusClarification',
  'Type',
  'StartDate',
  'EndDate',
  'DailyBudget',
  'Funds',
]

/**
 * Fetch campaigns (excluding deleted by default).
 */
export async function getCampaigns(limit = 100): Promise<Campaign[]> {
  const result = await callService<{ Campaigns?: Campaign[] }>('campaigns', 'get', {
    SelectionCriteria: {},
    FieldNames: CAMPAIGN_FIELDS,
    Page: { Limit: Math.min(Math.max(limit, 1), 1000), Offset: 0 },
  })
  return result.Campaigns ?? []
}

export interface CreateCampaignInput {
  name: string
  startDate: string // YYYY-MM-DD
  dailyBudgetAmount?: number // in account currency units (will be converted to micro)
}

/**
 * Create a minimal Text campaign with a safe default bidding strategy.
 * Serving is OFF on the network by default to avoid accidental spend.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<number> {
  const campaign: Record<string, unknown> = {
    Name: input.name,
    StartDate: input.startDate,
    TextCampaign: {
      BiddingStrategy: {
        Search: { BiddingStrategyType: 'HIGHEST_POSITION' },
        Network: { BiddingStrategyType: 'SERVING_OFF' },
      },
    },
  }

  if (input.dailyBudgetAmount && input.dailyBudgetAmount > 0) {
    // Direct expects budget in micro-units (1 unit = 1_000_000).
    campaign.DailyBudget = {
      Amount: Math.round(input.dailyBudgetAmount * 1_000_000),
      Mode: 'STANDARD',
    }
  }

  const result = await callService<{ AddResults?: ActionResultItem[] }>('campaigns', 'add', {
    Campaigns: [campaign],
  })

  const item = result.AddResults?.[0]
  if (item?.Errors?.length) {
    const e = item.Errors[0]
    throw new YandexDirectError(e.Message, e.Code, e.Details)
  }
  if (!item?.Id) {
    throw new YandexDirectError('Кампания не была создана', -4)
  }
  return item.Id
}

export interface UpdateCampaignInput {
  id: number
  name?: string
  dailyBudgetAmount?: number
}

export async function updateCampaign(input: UpdateCampaignInput): Promise<void> {
  const campaign: Record<string, unknown> = { Id: input.id }
  if (input.name !== undefined) campaign.Name = input.name
  if (input.dailyBudgetAmount !== undefined && input.dailyBudgetAmount > 0) {
    campaign.DailyBudget = {
      Amount: Math.round(input.dailyBudgetAmount * 1_000_000),
      Mode: 'STANDARD',
    }
  }

  const result = await callService<{ UpdateResults?: ActionResultItem[] }>('campaigns', 'update', {
    Campaigns: [campaign],
  })
  const item = result.UpdateResults?.[0]
  if (item?.Errors?.length) {
    const e = item.Errors[0]
    throw new YandexDirectError(e.Message, e.Code, e.Details)
  }
}

/**
 * Run a lifecycle action on a single campaign by id.
 */
export async function campaignAction(action: CampaignAction, id: number): Promise<void> {
  const resultKeyMap: Record<CampaignAction, string> = {
    suspend: 'SuspendResults',
    resume: 'ResumeResults',
    archive: 'ArchiveResults',
    unarchive: 'UnarchiveResults',
    delete: 'DeleteResults',
  }

  const result = await callService<Record<string, ActionResultItem[]>>('campaigns', action, {
    SelectionCriteria: { Ids: [id] },
  })

  const items = result[resultKeyMap[action]]
  const item = items?.[0]
  if (item?.Errors?.length) {
    const e = item.Errors[0]
    throw new YandexDirectError(e.Message, e.Code, e.Details)
  }
}
