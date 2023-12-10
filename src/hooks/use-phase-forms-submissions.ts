import { useQuery } from "@tanstack/react-query";

import { useTarkenApi } from "@tarkenag/tex-client-react-sdk";
import { IFormsSubmissionsDTO, IPhaseDTO } from "../services/tarken-hub-api/tarken-crm-ticket.dtos";

export const usePhaseFormsSubmissions = (props: {
  workflowPhases: IPhaseDTO[]
  organizationId: string
  ticketWorkflowId: string
  ticketId: string
}) => {
  const texAuth = useTarkenApi()

  const tarkenHubApi = texAuth.hub.httpClient

  const phaseTicketFormIds = props.workflowPhases.map(phase => phase.ticketForm?.id).filter(Boolean)

  return useQuery({
    queryKey: ['forms-submissions', props.ticketWorkflowId],
    enabled: phaseTicketFormIds.length > 0,
    queryFn: () =>
      tarkenHubApi
      .get<IFormsSubmissionsDTO[]>('/crm/forms/submissions', {
        params: {
          organizationId: props.organizationId,
          entityRecordId: props.ticketId,
          formIds: phaseTicketFormIds,
        },
      })
      .then(res => res.data)
  })
}