import '@fontsource/inter';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { useTicketSearchParams } from './hooks/use-search-params'
import { TicketDetails } from './components/TicketDetails'
import { TexViewContainer } from '@tarkenag/tex-client-react-sdk'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    }
  }
})

function App() {
  const { ticketId } = useTicketSearchParams()

  return (
    <TexViewContainer
      location='workflow.ticket.type.credit-request.detail'
      renderLoading={() => <div>Carregando...</div>}
      renderError={
        (error) => (
          <div>
            <h1>Erro ao carregar TEx bridge</h1>
            <p>{error.message}</p>
          </div>
        )
      }
    >
      <QueryClientProvider client={queryClient}>
        <TicketDetails ticketId={ticketId} />
      </QueryClientProvider>
    </TexViewContainer>
  )
}

export default App
