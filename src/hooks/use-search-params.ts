export function useTicketSearchParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const ticketId = urlParams.get('ticket_to_use')

  if (!ticketId) {
    throw new Error(`"ticket_to_use" URL search parameter is required!`)
  }

  return {
    ticketId,
  }
}
