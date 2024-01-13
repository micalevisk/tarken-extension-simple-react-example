import { styled } from '@mui/material/styles';
import { useQuery } from "@tanstack/react-query";

import { useTarkenApi } from "@tarkenag/tex-client-react-sdk";
import { IConsolidatedDebtsStatementsDTO, ICustomerCashflowDTO } from "../services/tarken-hub-api/tarken-crm-ticket.dtos";

const CashflowEntryContentDiv = styled('div')`
  display: flex;
  padding: 6px 8px;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
  align-self: stretch;

  border-radius: 8px;
  background: #F8F9FA;

  border-color: red;

  .entry-title {
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    color: #343A40;
  }

  .entry-value {
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    color: #F03E3E;
  }
`;

const CustomerCashflowIndicatorContainer = styled('div')`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  align-self: stretch;
  justify-content: space-between;
  align-self: stretch;
`

const CustomerCashflowEntry: React.FC<{ title: string, currencyValue: number | undefined }> = (props) => {
  const formattedCurrencyValue = props.currencyValue?.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) ?? 'N/A'

  return (
    <CashflowEntryContentDiv>
      <span className="entry-title">{props.title}</span>
      <span className="entry-value">{formattedCurrencyValue}</span>
    </CashflowEntryContentDiv>
  )
}


const CustomerCashflow: React.FC<{ customerId: string }> = ({ customerId }) => {
  const texAuth = useTarkenApi()

  const tarkenHubApi = texAuth.hub.httpClient

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-cashflow', customerId],
    queryFn: () =>
      tarkenHubApi
        .get<ICustomerCashflowDTO>('/customer-cashflow', {
          params: {
            customerId,
          }
        })
        .then(res => res.data)
  })

  if (isLoading) {
    return <div>Buscando informações do fluxo de caixa...</div>
  }
  if (error || !data) {
    console.error(error)
    return <div>Algo deu errado ao buscar informações do fluxo de caixa do cliente</div>
  }

  const customerCashflow = data

  return (
    <CustomerCashflowEntry
      title="Resultado operacional agrícola"
      currencyValue={customerCashflow.totalInflow}
    />
  )
}


const CustomerConsolidatedDebtStatements: React.FC<{ customerId: string }> = ({ customerId }) => {
  const texAuth = useTarkenApi()

  const tarkenHubApi = texAuth.hub.httpClient

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-consolidated-debts-statements', customerId],
    queryFn: () =>
      tarkenHubApi
        .get<IConsolidatedDebtsStatementsDTO>('/consolidated-debts-statements', {
          params: {
            customerId,
          }
        })
        .then(res => res.data)
  })

  if (isLoading) {
    return <div>Buscando informações do consolidado de endividamento...</div>
  }
  if (error || !data) {
    console.error(error)
    return <div>Algo deu errado ao buscar informações do consolidado de endividamento do cliente</div>
  }

  const customerConsolidatedDebtStatements = data

  const effectiveValue = customerConsolidatedDebtStatements.shortTermFinancingResult.effectiveValue ??
    (
      (customerConsolidatedDebtStatements.shortTermFinancingResult.SCRValue.isEnabled ? customerConsolidatedDebtStatements.shortTermFinancingResult.SCRValue.value : 0) +
      (customerConsolidatedDebtStatements.shortTermFinancingResult.IRPFDebtsValue.isEnabled ? customerConsolidatedDebtStatements.shortTermFinancingResult.IRPFDebtsValue.value : 0) +
      (customerConsolidatedDebtStatements.shortTermFinancingResult.others?.isEnabled ? customerConsolidatedDebtStatements.shortTermFinancingResult.others.value : 0)
    )

  return (
    <CustomerCashflowEntry
      title="Endividamento CP"
      currencyValue={effectiveValue}
    />
  )
}

export const CreditRequestCustomerCashflowSummary: React.FC<{
  creditRequestRelatedCustomerId: string | undefined
}> = ({ creditRequestRelatedCustomerId }) => {

  if (!creditRequestRelatedCustomerId) {
    return (
      <div>Nenhum cliente foi atribuído ao pedido!</div>
    )
  }

  return (
    <CustomerCashflowIndicatorContainer>
      <CustomerCashflow customerId={creditRequestRelatedCustomerId} />
      <CustomerConsolidatedDebtStatements customerId={creditRequestRelatedCustomerId} />
    </CustomerCashflowIndicatorContainer>
  )
}