import { useQuery } from "@tanstack/react-query";
import { useTexContext, useTarkenApi, useTexMetadata } from "@tarkenag/tex-client-react-sdk";

import type { IPhaseDTO } from "../services/tarken-hub-api/tarken-crm-ticket.dtos";
import { CreditRequestRating } from "./CreditRequestRating";
import { CreditRequestCustomerCashflowSummary } from "./CreditRequestCustomerCashFlow";
import { CreditRequestFeedbacks } from "./CreditRequestFeedbacks";
import { useTicketDetails } from "../hooks";

const useTicketWorkflowPhases = (props: { ticketWorkflowId: string | undefined }) => {
  const texAuth = useTarkenApi()
  const texAuthUnversioned = useTarkenApi()

  const tarkenHubApi = texAuth.hub.httpClient

  if (props?.ticketWorkflowId) {
    console.debug('fetching workflow details...')
    void texAuthUnversioned.hub.httpClient.get(`/v1/crm/workflows/${props.ticketWorkflowId}`)
    .then(console.debug, console.error)
  }

  return useQuery({
    queryKey: ['workflow-phases', props?.ticketWorkflowId],
    enabled: !!props.ticketWorkflowId,
    queryFn: () =>
      tarkenHubApi
        .get<IPhaseDTO[]>('/crm/phases', {
          params: {
            workflowId: props?.ticketWorkflowId,
          }
        })
        .then(res => res.data)
  })
}

const useTicketContext = () => {
  const texContext = useTexContext('workflow.ticket.type.credit-request.detail')
  return texContext
}

export const TicketDetails: React.FC<{ ticketId: string }> = ({ ticketId }) => {
  const ticketDetails$ = useTicketDetails({ ticketId })
  const workflowPhases$ = useTicketWorkflowPhases({ ticketWorkflowId: ticketDetails$.data?.workflowId })
  const ticketLocationContextData = useTicketContext();
  const extensionMetadata = useTexMetadata();

  const ticketDetails = ticketDetails$.data
  const workflowPhases = workflowPhases$.data

  if (ticketDetails$.error) {
    console.error(ticketDetails$.error.message)
    return <div>Algo deu errado ao buscar informações da proposta</div>
  }
  if (workflowPhases$.error) {
    console.error(workflowPhases$.error.message)
    return <div>Algo deu errado ao buscar informações da proposta</div>
  }
  if (ticketDetails$.isLoading || !ticketDetails || !workflowPhases || !extensionMetadata
  ) {
    return <div>Buscando informações do ticket</div>
  }

  const ticket = {
    id: ticketDetails.id,
    workflowId: ticketDetails.workflowId,
    currentPhaseId: ticketDetails.currentPhaseId,
  }
  const workflow = {
    id: ticketDetails.workflowId,
    phases: workflowPhases,
  }

  return <>
    <h1>Environment: {extensionMetadata.environment}</h1>
    <h1>TEx Version: {extensionMetadata.version}</h1>
    <h1>Host: {extensionMetadata.hostOrigin}</h1>

    <CreditRequestRating ticket={ticket} workflow={workflow} />

    <CreditRequestCustomerCashflowSummary
      creditRequestRelatedCustomerId={ticketDetails.relatedCustomer?.id || undefined} />

    <CreditRequestFeedbacks ticket={ticket} workflow={workflow} organizationId={ticketLocationContextData.organizationId} />
  </>
}
