import LoadingButton from '@mui/lab/LoadingButton';
import { styled } from '@mui/material/styles';
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { CalculatorIcon } from "../assets/icons/Calculator";
import { CaretRightIcon } from "../assets/icons/CaretRight";
import { CurrencyCircleDollar } from "../assets/icons/CurrencyCircleDollar";
import { useTarkenApi } from '../libs/tex-react-client-sdk';
import { ICreditLimitRequestHistoryDTO, IPhaseDTO, ITransitionRuleDTO } from '../services/tarken-hub-api/tarken-crm-ticket.dtos';

const Header = styled('span')`
  display: inherit;
  padding: 10px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  border-radius: 8px;
  background: #D9ECFC;

  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const CreditRatingDiv = styled('div')`
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`

const CreditRequestRatingView: React.FC<{
  rating: {
    scoreGrade: string | undefined
    score: number | undefined
    suggestedLimit: number | undefined
  }
}> = (props) => {
  const formattedScoreValue = props.rating.score?.toFixed(2) ?? 'N/A'

  const formattedScoreGrade = props.rating.scoreGrade
    ? ` (${props.rating.scoreGrade}) `
    : ''

  const formattedSuggestedLimit = props.rating.suggestedLimit?.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) ?? 'N/A'

  return (
    <CreditRatingDiv>
      <span style={{ marginRight: '4px' }}>
        <CalculatorIcon color='#4B5B72' size="20" />
      </span>
      <span>
        Rating {formattedScoreValue}
        <span style={{ color: '#868E96' }}>{formattedScoreGrade}</span>
        <span style={{ color: '#B4B9BE', margin: '4px' }}>&#124;</span>
        <CurrencyCircleDollar bg="#4B5B72" size="20" /> Limite {formattedSuggestedLimit}
      </span>
    </CreditRatingDiv>
  )
}

const ApproveCreditRequestButton: React.FC<{
  ticket: {
    id: string
    currentPhaseId: string
    workflowId: string
  }
  workflow: {
    id: string
    phases: IPhaseDTO[]
  }
}> = (props) => {
  const texAuth = useTarkenApi()

  const tarkenHubApi = texAuth.hub.httpClient

  const queryClient = useQueryClient()

  const { data, isLoading, error, status } = useQuery({
    queryKey: ['workflow-transitions', props.ticket.workflowId],
    queryFn: () =>
      tarkenHubApi.get<ITransitionRuleDTO[]>('/crm/transitions', {
        params: {
          workflowId: props.ticket.workflowId,
        }
      })
      .then(res => res.data)
  })

  if (error || (!data && status !== 'pending')) {
    return <div>Algo deu errado ao buscar informações das transições do workflow</div>
  }

  const workflowTransitionRules = data
  if (!workflowTransitionRules && !isLoading) {
    throw new Error('Something went wrong on fetching workflow transition rules')
  }

  const firstSucceededPhase = props.workflow.phases.find(phase => phase.type === 'CONCLUDED')
  if (!firstSucceededPhase) {
    // Nothing to do if there is no 'CONCLUDED' phase at all
    return <></>
  }

  const isTicketOnFirstSucceededPhase = props.ticket.currentPhaseId === firstSucceededPhase.id
  if (isTicketOnFirstSucceededPhase) {
    // Nothing to do if the ticket is the first 'CONCLUDED' phase
    return <></>
  }

  const isTransitionRuleAvailable = workflowTransitionRules?.some(transtionRule =>
    transtionRule.fromPhaseId === props.ticket.currentPhaseId && transtionRule.toPhaseId === firstSucceededPhase.id)

  // TODO: use useMutation from react-query to easily add some throttling
  // Not using useMutation here due to the chain of deps
  const actionCreateTicketTransition = () =>
    tarkenHubApi.post(`/crm/tickets/${props.ticket.id}/transitions`, {
      fromPhaseId: props.ticket.currentPhaseId,
      toPhaseId: firstSucceededPhase.id,
    })
    .then(() => {
      // the ticket was updated so we need to refetch it
      queryClient.invalidateQueries({
        queryKey: ['ticket-details', props.ticket.id],
      })
    })
    .catch(console.error)

  return (
    <LoadingButton
      loading={isLoading}
      disabled={!isTransitionRuleAvailable}
      sx={{
        ml: "auto",
        backgroundColor: "#111315",
        color: "#FFF",
        fontSize: "14px",
        fontStyle: "normal",
        fontWeight: 500,
        lineHeight: "normal",
        borderRadius: "8px",

        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        },
        '&:disabled': {
          opacity: 0.4,
          color: "#FFF",
        }
      }}
      onClick={() => actionCreateTicketTransition()}
    >Aprovar Limite <CaretRightIcon/></LoadingButton>
  )
}

export const CreditRequestRating: React.FC<{
  ticket: {
    id: string
    currentPhaseId: string
    workflowId: string
  }
  workflow: {
    id: string
    phases: IPhaseDTO[]
  }
}> = (props) => {
  const texAuth = useTarkenApi()

  const tarkenHubApi = texAuth.hub.httpClient

  const { data, isLoading, error } = useQuery({
    queryKey: ['credit-request-rating', props.ticket.id, 'SUCCEEDED'],
    queryFn: () =>
      tarkenHubApi.get<ICreditLimitRequestHistoryDTO>('/crm/credit-limit-requests', {
        params: {
          ticketId: props.ticket.id,
          limit: 1,
          page: 1,
          status: 'SUCCEEDED'
        }
      }).then(res => res.data)
  })

  if (isLoading) {
    return <div>Buscando informações da proposta...</div>
  }
  if (error || !data) {
    console.error(error)
    return <div>Algo deu errado ao buscar informações da proposta</div>
  }

  const creditLimitRequests = data

  const latestCreditRequestExecution = creditLimitRequests.results[0]?.creditRatingExecution

  return (
    <Header>
      <CreditRequestRatingView rating={
        {
          score: latestCreditRequestExecution?.score,
          scoreGrade: latestCreditRequestExecution?.scoreGrade,
          suggestedLimit: latestCreditRequestExecution?.suggestedLimit,
        }
      } />
      <ApproveCreditRequestButton ticket={props.ticket} workflow={props.workflow} />
    </Header>
  )
}
