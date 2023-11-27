import * as axios from 'axios'
import { ICreateTicketTransitionDTO, ICreditLimitRequestHistoryDTO, ITicketDetailsDTO, ITicketTransitionShortDTO, ITransitionRuleDTO } from "./tarken-crm-ticket.dtos";

class TarkenHubCrmTicketsApi {
  constructor(private readonly httpClient: axios.AxiosInstance) {}

  async fetchTicketDetails(opts: {
    bearerToken: string,
    ticketId: string,
  }) {
    const res = await this.httpClient.get<ITicketDetailsDTO>('/crm/tickets/' + opts.ticketId)
    return res.data
  }

  createTicketTransition(opts: {
    bearerToken: string,
    ticketId: string,
    data: {
      fromPhaseId: string,
      toPhaseId: string,
    }
  }) {
    return this.httpClient.post<ICreateTicketTransitionDTO, ITicketTransitionShortDTO>('/crm/tickets/' + opts.ticketId + '/transitions', opts.data)
  }
}

class TarkenHubCrmWorkflowApi {
  constructor(private readonly httpClient: axios.AxiosInstance) {}

  fetchWorkflowTransitions(opts: {
    bearerToken: string,
    workflowId: string,
  }) {
    return this.httpClient.get<ITransitionRuleDTO[]>('/crm/transitions', {
      params: {
        workflowId: opts.workflowId,
      },
    })
  }
}

class TarkenHubCrmCreditLimit {
  constructor(private readonly httpClient: axios.AxiosInstance) {}

  fetchLastSucceededCreditLimitRequest(opts: {
    bearerToken: string,
    ticketId: string,
  }) {
    return this.httpClient.get<ICreditLimitRequestHistoryDTO>('/crm/credit-limit-requests/', {
      params: {
        ticketId: opts.ticketId,
        limit: 1,
        page: 1,
        status: 'SUCCEEDED'
      },
    })
  }
}

export class TarkenHubApi {
  tickets: TarkenHubCrmTicketsApi
  workflows: TarkenHubCrmWorkflowApi
  creditLimit: TarkenHubCrmCreditLimit

  constructor(opts: {
    env: 'dev' | 'prod'
  }) {
    const httpClient = axios.default.create({
      baseURL: `https://${opts.env}.api.hub.tarken.ag/api/v1`,
      timeout: 30_000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    this.tickets = new TarkenHubCrmTicketsApi(httpClient)
    this.workflows = new TarkenHubCrmWorkflowApi(httpClient)
    this.creditLimit = new TarkenHubCrmCreditLimit(httpClient)
  }
}
