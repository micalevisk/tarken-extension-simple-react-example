// This is suppose to inject the Tarken SDK into the global scope so that pages can use it as a library
(function __injectTex__() {
  const eventSubscribers = {
    onAuthorized: [],
    onContext: [],
  }

  const TARKEN_ALLOWED_PARENT_ORIGINS = [
    // Tarken domain addresses
    'https://hub-dev.tarken.ag', // development
    'https://hub-homolog.tarken.ag', // staging
    'https://hub.tarken.ag', // production
    // hub-web-client development addresses
    'http://localhost:8080',
    'http://localhost:3000',
  ]
  function listenToTarkenExtensionEventBus(evt) {
    // #region security & message transformation+validation
    if (!evt.isTrusted) return;
    if (!TARKEN_ALLOWED_PARENT_ORIGINS.includes(evt.origin)) return;

    /**
     * @type { {_v:string,e:string,d:any} }
     */
    let messageData;
    try {
      messageData = JSON.parse(evt.data)
      if (typeof messageData !== 'object') return;
      // Validate the shape
      const hasVersionField = messageData.hasOwnProperty('_v') && typeof messageData._v === 'string';
      const hasEventNameField = messageData.hasOwnProperty('e') && typeof messageData.e === 'string';
      const hasEventDataField = messageData.hasOwnProperty('d') && typeof messageData.d === 'object';
      if (!hasVersionField || !hasEventNameField || !hasEventDataField) return;
    } catch {
      return;
    }
    if (!messageData) return;
    // #endregion

    const { e: eventName, d: eventData } = messageData;

    switch (eventName) {
      case 'on_context': {
        // Trigger all subscribers of this event
        eventSubscribers.onContext.forEach(subscriber => subscriber(eventData));
        break;
      }
      case 'on_authorized': {
        // Trigger all subscribers of this event
        eventSubscribers.onAuthorized.forEach(subscriber => subscriber(eventData));
        break;
      }
    }
  }
  window.addEventListener('message', listenToTarkenExtensionEventBus);

  function subscribeToOnAuthorizedEvent(subscribeFn) {
    let subscriberIndex = eventSubscribers.onAuthorized.indexOf(subscribeFn);
    const unsubscribeFromEvent = () => {
      if (subscriberIndex >= 0) eventSubscribers.onAuthorized.splice(subscriberIndex, 1);
    }

    // De-duplicate subscribers
    if (subscriberIndex === -1) eventSubscribers.onAuthorized.push(subscribeFn);
    return unsubscribeFromEvent;
  }

  function subscribeToOnContextEvent(subscribeFn) {
    let subscriberIndex = eventSubscribers.onContext.indexOf(subscribeFn);
    const unsubscribeFromEvent = () => {
      if (subscriberIndex >= 0) eventSubscribers.onContext.splice(subscriberIndex, 1);
    }

    // De-duplicate subscribers
    if (subscriberIndex === -1) eventSubscribers.onContext.push(subscribeFn);
    return unsubscribeFromEvent;
  }

  // ======================================================================= //
  // Public API
  // ======================================================================= //
  window.Tarken = window.Tarken || Object.create(null)
  Object.assign(window.Tarken, {
    tex: {
      version: "1.0.0",

      onAuthorized: subscribeToOnAuthorizedEvent,
      onContext: subscribeToOnContextEvent,
    },
  })
}());
