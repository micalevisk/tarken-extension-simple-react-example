export function useTicketSearchParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const ticketId = '65970bcf-1051-4ca6-88f2-e63f5ca3c080'  //urlParams.get('ticket_to_use')

  if (!ticketId) {
    throw new Error(`"ticket_to_use" URL search parameter is required!`)
  }

  return {
    ticketId,
  }
}
