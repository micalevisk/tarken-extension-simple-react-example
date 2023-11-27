export function useTicketSearchParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const ticketId = urlParams.get('ticket')

  if (!ticketId) {
    throw new Error(`"ticket" URL search parameter is required!`)
  }

  return {
    ticketId,
  }
}
