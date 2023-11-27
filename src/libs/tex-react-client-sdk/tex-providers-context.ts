import * as TExSDK from './tex-sdk';

import { createContext, useContext } from 'react';
import type { TexAvailableContextLocations, TexAvailableContextByLocation } from './types';

/** */
// TODO: improve typing to get ride of the `unknown` type in favor of a narrower type
export const TexProvidersContext = createContext<null | {
  hub: TExSDK.TexHubProvider;
  contextData: unknown;
}>(null);

/**
 * @public
 */
export const useTarkenApi = () => {
  const context = useContext(TexProvidersContext);
  if (!context) {
    throw new Error('useTarkenApi must be used within a <TexViewContainers>');
  }
  return {
    hub: context.hub,
  };
}

/**
 * @public
 */
export const useTexContext = <T extends TexAvailableContextLocations>(
  // This is here for type-narrowing sake
  _location: T
): TexAvailableContextByLocation[T] => {
  const context = useContext(TexProvidersContext);
  if (!context) {
    throw new Error('useTexContext must be used within a <TexViewContainers>');
  }
  return context.contextData as TexAvailableContextByLocation[typeof _location]
}