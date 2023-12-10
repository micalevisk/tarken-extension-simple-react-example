import { useQuery } from "@tanstack/react-query";

import { ITicketDetailsDTO } from "../services/tarken-hub-api/tarken-crm-ticket.dtos";
import { useTarkenApi } from "@tarkenag/tex-client-react-sdk";

export const useTicketDetails = (props: { ticketId: string }) => {
  const texAuth = useTarkenApi()

  const tarkenHubApi = texAuth.hub.httpClient

  // We need to fetch ticket details because the location in which this extension
  // will be loadied does not have access to ticket details we want to use
  return useQuery({
    queryKey: ['ticket-details', props.ticketId],
    queryFn: () =>
      tarkenHubApi.get<ITicketDetailsDTO>(`/crm/tickets/${props.ticketId}`).then(res => res.data),
  })
}
