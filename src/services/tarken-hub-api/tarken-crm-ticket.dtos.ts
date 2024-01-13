export interface ITicketDetailsDTO {
  id: string;
  workflowId: string;
  currentPhaseId: string;
  identifier: string;
  name?: string;
  fields: Record<string, unknown>;
  relatedCustomer?: {
    id: string;
    [k: string]: unknown;
  }
  [k: string]: unknown;
}

export interface ICreateTicketTransitionDTO {
  fromPhaseId: string;
  toPhaseId: string;
}

export interface ITicketTransitionShortDTO {
  id: string;
  [k: string]: unknown;
}

export interface ITransitionRuleDTO {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
}

export interface ICreditLimitRequestHistoryDTO {
  page_total: number
  total: number
  results: Array<{
    id: string
    [k: string]: unknown
    creditRatingExecution?: {
      scoreGrade?: string
      score?: number
      suggestedLimit?: number
    }
  }>
}

export interface ICustomerCashflowDTO {
  [k: string]: unknown
  totalInflow: number
}

export interface IConsolidatedDebtsStatementsDTO {
  [k: string]: unknown
  shortTermFinancingResult: {
    SCRValue: { isEnabled: boolean, value: number }
    IRPFDebtsValue: { isEnabled: boolean, value: number }
    effectiveValue?: number
    others?: { isEnabled: boolean, value: number  }
  }
}

export interface IPhaseDTO {
  id: string;
  name: string;
  description?: string;
  [k: string]: unknown

  type: 'BACKLOG' | 'IN_PROGRESS' | 'CONCLUDED' | 'REJECTED'
  ticketForm?: {
    id: string
    [k: string]: unknown
  }
}

export interface IFormsSubmissionsDTO {
  formId: string
  lastUpdateByUser?: {
    id: string
    name: string
    lastName?: string
    [k: string]: unknown
  }
  fieldsValues: Array<{
    fieldIdentifier: string
    value: unknown
  }>
}