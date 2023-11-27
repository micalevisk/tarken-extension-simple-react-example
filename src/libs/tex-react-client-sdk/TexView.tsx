import { memo, useEffect, useState } from "react"

import * as TExSDK from "./tex-sdk"
import { TexProvidersContext } from "./tex-providers-context"
import { useTexEventListener } from "./hooks"
import type { TexAvailableContextByLocation, TexAvailableContextLocations } from "./types"

type TexContextDataResolverByLocation = {
  [key in TexAvailableContextLocations]: (dataSource: URLSearchParams) => TexAvailableContextByLocation[key]
}

/**
 * This is here to make the TEx bridge supports both the sandboxed and
 * standalone modes.
 *
 * The sandboxed mode is used when the TEx bridge is loaded in a
 * sandboxed iframe, like the one used in the integration with Hub platform.
 *
 * The standalone mode is usually used when developing the TEx client
 * without the integration with the platform.
 * As the extension may expects few context data, this `useTexBusContext` hook
 * is here to fulfill all the context data available for the chosen location.
 */
const useTexBusContext = (((isSandboxed) => {
  if (isSandboxed) {
    return (location: TexAvailableContextLocations) => useTexEventListener('on_context', location)
  }

  // TODO(micalevisk): proper object validator for each context schema definition instead of using `!` operator
  const contextDataResolverByLocation: TexContextDataResolverByLocation = {
    "workflow.ticket.type.credit-request.detail": (dataSource: URLSearchParams) => ({
      organizationId: dataSource.get('tex__organizationId')!,
      ticketId: dataSource.get('tex__ticketId')!,
    }),

    "global.navigation-bar.menu": (dataSource: URLSearchParams) => ({
      organizationId: dataSource.get('tex__organizationId')!,
    }),
  }

  return (location: TexAvailableContextLocations): TexAvailableContextByLocation[typeof location] => {
    const contextDataResolverFn = contextDataResolverByLocation[location]

    const urlParams = new URLSearchParams(window.location.search)
    const contextData = contextDataResolverFn(urlParams)

    return contextData
  }
})(window.self !== window.top))

interface ITexViewProps {
  children: React.ReactNode
  /**
   * The context location where the TEx bridge is being loaded.
   */
  location: TexAvailableContextLocations
  /**
   * @returns A React node to be rendered while the TEx bridge is loading.
   */
  renderLoading?: () => React.ReactNode
  /**
   * @returns A React node to be rendered when the TEx bridge fails to load.
   */
  renderError?: (error: Error) => React.ReactNode
}

/**
 * @public
 */
const _TexViewContainer: React.FC<ITexViewProps> = (props) => {
  const [texAuthProvider, setTexAuthProvider] = useState<null | TExSDK.TexHubProvider | Error>(null)

  const maybeContextData = useTexBusContext(props.location)

  useEffect(() => {
    TExSDK.init()
      .then((result) => {
        setTexAuthProvider(result.hub)
      }, (error) => {
        setTexAuthProvider(error)
      })
  }, [])

  if (!texAuthProvider || !maybeContextData) {
    return props.renderLoading?.() ?? null
  }

  if (texAuthProvider instanceof Error) {
    return props.renderError?.(texAuthProvider) ?? null
  }

  return (
    <TexProvidersContext.Provider value={{ hub: texAuthProvider, contextData: maybeContextData }}>
      {props.children}
    </TexProvidersContext.Provider>
  )
}

/**
 * @public
 */
export const TexViewContainer = memo(_TexViewContainer)