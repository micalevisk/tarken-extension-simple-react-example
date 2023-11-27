import type { TexEvents } from '@tarkenag/tex-extension-helper'

export type TexEventsDataByEventName = TexEvents
export type TexAvailableContextLocations = keyof TexEvents['on_context']
export type TexAvailableContextByLocation = TexEvents['on_context']