const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const apiAudience = import.meta.env.VITE_API_AUDIENCE;

if (!tenantId || !clientId || !apiAudience) {
  throw new Error('Missing required environment variables for MSAL configuration');
}

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => {
        if (containsPii) return;
        switch (level) {
          case 0:
            console.error(message);
            break;
          case 1:
            console.warn(message);
            break;
          default:
            break;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: [`${apiAudience}/.default`],
};

export const tokenRequest = {
  scopes: [`${apiAudience}/.default`],
};

let msalInstanceSingleton: any = null;
let msalInstancePromise: Promise<any> | null = null;

export async function getMsalInstance() {
  if (msalInstanceSingleton) {
    return msalInstanceSingleton;
  }

  if (msalInstancePromise) {
    return msalInstancePromise;
  }

  msalInstancePromise = (async () => {
    const { PublicClientApplication } = await import('@azure/msal-browser');
    const instance = new PublicClientApplication(msalConfig);
    await instance.initialize();
    msalInstanceSingleton = instance;
    return instance;
  })();

  return msalInstancePromise;
}
