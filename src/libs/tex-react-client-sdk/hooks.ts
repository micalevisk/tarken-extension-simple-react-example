import { useEffect, useState } from "react"
import type { TexAvailableContextLocations, TexEventsDataByEventName } from "./types";

/**
 * @returns The event callback name to be used to register the event listener in
 * the TEx Extension Helper library.
 */
function resolveEventCallbackNameByEventName<T extends keyof TexEventsDataByEventName>(eventName: T) {
  switch (eventName) {
    case 'on_authorized': return 'onAuthorized';
    case 'on_context': return 'onContext';
    default:
      // Silently ignore unknown event names
      return undefined;
  }
}


/** */
export const useTexEventListener = <T extends keyof TexEventsDataByEventName, Entry extends keyof TexEventsDataByEventName[T]>(eventName: T, _location: TexAvailableContextLocations) => {
  const [eventData, setEventData] = useState<TexEventsDataByEventName[T][Entry]>()

  useEffect(() => {
    const isTarkenExtensionAvailable = !!window.Tarken?.tex;
    if (!isTarkenExtensionAvailable) return;

    const eventCallbackName = resolveEventCallbackNameByEventName(eventName);
    if (!eventCallbackName) {
      console.error(`[useTexEventListener] Unknown event name: "${eventName}"`);
      return;
    }

    const eventHandlerRegisterFn = window.Tarken.tex[eventCallbackName];
    if (!eventHandlerRegisterFn) return;

    // A generic and dynamic way of calling `window.Tarken.tex.onAuthorized(onTarkenExtensionBusEvent)`
    const unsubscribeListernFromEvent = eventHandlerRegisterFn(function onTarkenExtensionBusEvent(eventData: unknown) {
      setEventData(eventData as TexEventsDataByEventName[T][Entry]);
    });

    return () => {
      unsubscribeListernFromEvent?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return eventData;
}