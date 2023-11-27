import axios, { AxiosInstance } from 'axios';
import { parseJwt } from './jwt-utils';

function parametersSerializer(params?: Record<string, unknown>): string {
  const urlSearchParams = new URLSearchParams();
  for (const parameter in params) {
    const value = params[parameter];
    if (value != undefined) urlSearchParams.set(parameter, String(value));
  }
  return urlSearchParams.toString();
}

interface TexLocalConfigFile {
  $version: 1;

  /** The target environment being tested on. This is useful for TEx Platform Developers. */
  environment: 'development' | 'staging' | 'production';
  /** Local general state. */
  state: null | {
    organization_id: string;
  };
  /**  */
  identities: {
    service_account: {
      client_id: string;
    };
    current_impersonation: null | {
      access_token: string;
    };
  };
}

/**
 * Establishes a connection to the Tarken Hub API as the current user from
 * local TEx configuration.
 *
 * Emulates the 'on_authorized' event.
 *
 * @throws An error object if the user access token has expired
 */
async function initTarkenConnectionBridgeFromConfigurationFile(
  texConfig: TexLocalConfigFile
) {
  const hubApiDomainByEnvironment = Object.create(null);
  hubApiDomainByEnvironment.development = 'dev.api.hub.tarken.ag';
  hubApiDomainByEnvironment.production = 'prod.api.hub.tarken.ag';
  hubApiDomainByEnvironment.staging = 'prod.api.hub.tarken.ag';

  const currentUserImpersonationAccessToken =
    texConfig['identities']['current_impersonation']?.['access_token'];
  const currentOrganizationId = texConfig['state']?.['organization_id'];

  if (!currentUserImpersonationAccessToken || !currentOrganizationId) {
    // TODO: wrap this error into a domain-specific error for better exception handling from consumers
    throw new Error('Failed to impersonate user: you must run $ tex login');
  }

  // TODO: add axios interceptor to refresh the bearer token when it expires using the refresh token from the TEx config file

  const userImpersonationAuthorizationToken = `Bearer ${currentUserImpersonationAccessToken}`;
  const userImpersonationHubHttpClient = axios.create({
    baseURL: `https://${
      hubApiDomainByEnvironment[texConfig.environment]
    }/api/v1`,
    timeout: 30_000,
    paramsSerializer: parametersSerializer,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: userImpersonationAuthorizationToken,
    },
  });

  const jwtTokenObj = parseJwt(currentUserImpersonationAccessToken);
  if (jwtTokenObj && typeof jwtTokenObj['exp'] === 'number') {
    const expirationTimestamp = jwtTokenObj['exp'] as number;
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = expirationTimestamp - now;
    const hasExpired = timeLeft <= 0;
    if (hasExpired) {
      // TODO: wrap this error into a domain-specific error for better exception handling from consumers
      throw new Error(
        'Failed to create an authenticated HTTP client: the access token has expired'
      );
    }
  }

  return {
    userImpersonationHubHttpClient,
    userImpersonationAuthorizationToken,
  };
}

/** */
function initTarkenConnectionBridge(
  userImpersonationToken: string,
  environment: string
) {
  const hubApiDomainByEnvironment = Object.create(null);
  hubApiDomainByEnvironment.development = 'dev.api.hub.tarken.ag';
  hubApiDomainByEnvironment.production = 'prod.api.hub.tarken.ag';
  hubApiDomainByEnvironment.staging = 'prod.api.hub.tarken.ag';

  const userImpersonationAuthorizationToken = `Bearer ${userImpersonationToken}`;
  const userImpersonationHubHttpClient = axios.create({
    baseURL: `https://${hubApiDomainByEnvironment[environment]}/api/v1`,
    timeout: 30_000,
    paramsSerializer: parametersSerializer,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: userImpersonationAuthorizationToken,
    },
  });

  return {
    userImpersonationHubHttpClient,
    userImpersonationAuthorizationToken,
  };
}

function checkIfIsInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export interface TexHubProvider {
  /**
   * The value that should be passed to `Authorization` header of the HTTP requests
   * for the Tarken Hub API.
   */
  authorizationToken: string;

  /**
   * The authenticated HTTP client for the Tarken Hub API.
   */
  httpClient: {
    // TODO(micalevisk): encapsulate the Tarken Hub API into our own abstraction or just expose Fetch API client to avoid leaking abstractions to SDK users
    get: AxiosInstance['get'];
    post: AxiosInstance['post'];
    put: AxiosInstance['put'];
  };
}

async function initLocally(): Promise<{
  hub: TexHubProvider;
}> {
  let texLocalConfig: TexLocalConfigFile | undefined;
  try {
    const texLocalConfigResponse = await fetch('.tex/tex.config.json');
    texLocalConfig = (await texLocalConfigResponse.json()) as TexLocalConfigFile;
  } catch {
    // TODO(micalevisk): wrap this error into a domain-specific error for better exception handling from consumers
    throw new Error(
      'Failed to initialize Tarken Hub SDK locally due to missing or invalid local configuration file.\nMake sure you have run "tex init"'
    );
  }

  if (!texLocalConfig) {
    throw new Error('This must not happen');
  }

  // TODO(micalevisk): validate texLocalConfig against the JSONSchema available for the extension
  const hubClient = await initTarkenConnectionBridgeFromConfigurationFile(
    texLocalConfig
  );
  return {
    hub: {
      httpClient: hubClient.userImpersonationHubHttpClient,
      authorizationToken: hubClient.userImpersonationAuthorizationToken,
    },
  };
}

export async function init(): Promise<{
  hub: TexHubProvider;
}> {
  if (!checkIfIsInIframe() && process.env.NODE_ENV !== 'production') {
    return initLocally();
  }

  const ENVIRONMENT_BY_ORIGIN = Object.create(null) as Record<string, string>;
  ENVIRONMENT_BY_ORIGIN['https://hub-dev.tarken.ag'] = 'development';
  ENVIRONMENT_BY_ORIGIN['https://hub-homolog.tarken.ag'] = 'staging';
  ENVIRONMENT_BY_ORIGIN['https://hub.tarken.ag'] = 'production';

  const TARKEN_ALLOWED_PARENT_ORIGINS = [
    // Tarken domain know origins
    'https://hub-dev.tarken.ag',
    'https://hub-homolog.tarken.ag',
    'https://hub.tarken.ag',
    // hub-web-client usual development addresses
    'http://localhost:8080',
    'http://localhost:3000',
  ];

  return new Promise(function initializeTexBridge(resolve) {
    function listenToTarkenExtensionEventBus(evt: MessageEvent) {
      // #region security & message transformation+validation
      if (!evt.isTrusted) return;
      if (!TARKEN_ALLOWED_PARENT_ORIGINS.includes(evt.origin)) return;

      let messageData: { _v: string; e: string; d: any } | undefined;
      try {
        messageData = JSON.parse(evt.data);
        if (typeof messageData !== 'object') return;
        // Validate the shape
        const hasVersionField =
          messageData.hasOwnProperty('_v') &&
          typeof messageData._v === 'string';
        const hasEventNameField =
          messageData.hasOwnProperty('e') && typeof messageData.e === 'string';
        const hasEventDataField =
          messageData.hasOwnProperty('d') && typeof messageData.d === 'object';
        if (!hasVersionField || !hasEventNameField || !hasEventDataField)
          return;
      } catch {
        return;
      }
      if (!messageData) return;
      // #endregion

      const environment = ENVIRONMENT_BY_ORIGIN[evt.origin];

      const { e: eventName, d: eventData } = messageData;

      if (eventName === 'on_authorized') {
        // Ensure that we will perform this only once to avoid concurrency issues
        window.removeEventListener('message', listenToTarkenExtensionEventBus);

        const currentUserImpersonationToken = eventData.token;
        const texBridge = initTarkenConnectionBridge(
          currentUserImpersonationToken,
          environment
        );
        resolve({
          hub: {
            httpClient: texBridge.userImpersonationHubHttpClient,
            authorizationToken: texBridge.userImpersonationAuthorizationToken,
          },
        });
      }
    }

    window.addEventListener('message', listenToTarkenExtensionEventBus);
  });
}
