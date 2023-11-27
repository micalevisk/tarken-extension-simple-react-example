import { styled } from '@mui/material/styles';
import { Typography } from "@mui/material";

import type { IPhaseDTO } from "../services/tarken-hub-api/tarken-crm-ticket.dtos";
import { usePhaseFormsSubmissions } from '../hooks';


const PhaseCardTitle = styled(Typography)`
  color: #3B5BDB;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  text-transform: uppercase;
  white-space: nowrap;
  text-overflow: ellipsis;

  border-radius: 4px;
  background:  #DBE4FF;

  display: inline;
  padding: 3px 4px;
  gap: 10px;
`

const PhaseCard: React.FC<
  {
    phase: Pick<IPhaseDTO, 'id' | 'name' | 'type'>
  }
> = (props) => {
  const phase = props.phase

  return (
    <PhaseCardTitle key={phase.id}>{phase.name}</PhaseCardTitle>
  )
}


const FeedbackCardSection = styled('div')`
  display: flex;
  padding: 12px 16px 16px 16px;
  justify-content: flex-start;
  flex-direction: row;
  align-items: flex-start;
  align-self: stretch;
  align-content: flex-start;
  gap: 1%;

  border-radius: 8px;
  border: 1px solid #E9EAEC;
`

const FeedbackCardTitle = styled(Typography)`
  color: #868E96;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
`

const FeedbackCardAuthor = styled(Typography)`
  color: #343A40;
  font-family: Inter;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
`

const FeedbackCardContent = styled(Typography)`
  margin-top: 10px;
`

const FeedbackEntryView: React.FC<{
  title: string
  content: string
  authorFullName: string
  workflowPhase: Pick<IPhaseDTO, 'id' | 'name' | 'type'>
}> = (props) => {
  return (
    <FeedbackCardSection>
      <FeedbackCardTitle>{props.title}</FeedbackCardTitle>
      <FeedbackCardAuthor>{props.authorFullName}</FeedbackCardAuthor>
      <PhaseCard phase={props.workflowPhase} />
      <FeedbackCardContent>{props.content}</FeedbackCardContent>
    </FeedbackCardSection>
  )
}


/** @throws {Error} If no phase were found for the given form ID. */
function findWorkflowPhaseByFormId(workflowPhases: IPhaseDTO[], formId: string): IPhaseDTO {
  const maybePhase = workflowPhases.find(phase => phase.ticketForm?.id === formId)
  if (!maybePhase) {
    throw new Error('Something went wrong on finding the workflow phase by form ID')
  }
  return maybePhase
}

const FeedbackTitle = styled('div')`
  color: #15181B;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
`
export const CreditRequestFeedbacks: React.FC<{
  organizationId: string,
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
  const { data, isLoading, error } = usePhaseFormsSubmissions({
    workflowPhases: props.workflow.phases,
    ticketWorkflowId: props.ticket.workflowId,
    ticketId: props.ticket.id,
    organizationId: props.organizationId,
  })

  if (isLoading) {
    return <div>Buscando informações de submissões da proposta...</div>
  }
  if (error || !data) {
    console.error(error)
    return <div>Algo deu errado ao buscar informações de submissões da proposta</div>
  }

  const submissions = data

  const feedbackSubmissions = submissions.reduce((feedbacks, formSubmission) => {
    const workflowPhase = findWorkflowPhaseByFormId(props.workflow.phases, formSubmission.formId)

    const maybeAuthor = formSubmission.lastUpdateByUser
      ? {
          id: formSubmission.lastUpdateByUser.id,
          name: formSubmission.lastUpdateByUser.name,
          lastName: formSubmission.lastUpdateByUser.lastName,
        }
      : undefined

    formSubmission.fieldsValues.forEach(fieldValue => {
      if (fieldValue.fieldIdentifier.includes('parecerSolicitacao')) {
        feedbacks.push({
          author: maybeAuthor,
          workflowPhase,
          fieldIdentifier: fieldValue.fieldIdentifier,
          label: 'Parecer Solicitação',
          value: (fieldValue.value as any).toString(),
        })
      }
      else if (fieldValue.fieldIdentifier.includes('parecerAnalista')) {
        feedbacks.push({
          author: maybeAuthor,
          workflowPhase,
          fieldIdentifier: fieldValue.fieldIdentifier,
          label: 'Parecer Analista',
          value: (fieldValue.value as any).toString(),
        })
      }
      else if (fieldValue.fieldIdentifier.includes('parecerRetornoComercial')) {
        feedbacks.push({
          author: maybeAuthor,
          workflowPhase,
          fieldIdentifier: fieldValue.fieldIdentifier,
          label: 'Parecer Retorno Comercial',
          value: (fieldValue.value as any).toString(),
        })
      }
    })

    return feedbacks;
  }, [] as Array<
    { fieldIdentifier: string,
      label: string,
      value: string,
      workflowPhase: Pick<IPhaseDTO, 'id' | 'name' | 'type'>,
      author?: { id: string, name: string, lastName?: string } }
  >)

  // If there are no feedbacks, don't render anything
  if (feedbackSubmissions.length === 0) {
    return null
  }

  return (
    <div>
      <FeedbackTitle>Pareceres</FeedbackTitle>
      <div>
      {feedbackSubmissions.map(feedback => {
        const authorFullName = feedback.author
          ? `${feedback.author.name} ${feedback.author.lastName || ''}`
          : 'Desconhecido'

        return <FeedbackEntryView
          key={feedback.fieldIdentifier}
          title={feedback.label}
          content={feedback.value}
          authorFullName={authorFullName}
          workflowPhase={feedback.workflowPhase}
        />
      })}
      </div>
    </div>
  )
}