import {
  signInWithEmailAndPassword,
  type Auth,
  type OAuthCredentialOptions,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import type { LoginProvider, FirebaseBasedLoginProvider } from '.';
import type { IdentityProvider } from '../Utils/GDevelopServices/Authentication';
import {
  setupAuthenticationWebSocket,
  terminateWebSocket,
} from '../Utils/GDevelopServices/Authorization';
import Window from '../Utils/Window';

const isDev = Window.isDev();

const authenticationPortalUrl = 'https://auth.gdevelop.io';

class BrowserLoginProvider
  implements LoginProvider, FirebaseBasedLoginProvider
{
  auth: Auth;
  constructor(auth: Auth) {
    this.auth = auth;
  }

  async loginWithEmailAndPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      // The user is now stored in `this.auth`.
    } catch (error) {
      console.error('Error while login:', error);
      throw error;
    }
  }

  async loginOrSignupWithProvider({
    provider,
    signal,
  }: {
    provider: IdentityProvider;
    signal?: AbortSignal;
  }): Promise<void> {
    if (signal && signal.aborted) {
      return Promise.reject(
        new Error('Login or Signup with provider already aborted.')
      );
    }
    const promise = new Promise<void>((resolve, reject) => {
      // Listen for abort event on signal
      if (signal) {
        signal.addEventListener('abort', () => {
          terminateWebSocket();
          reject(new Error('Login or Signup with provider aborted.'));
        });
      }
      const width = 400;
      const height = 600;
      const left = window.screenX + window.innerWidth / 2 - width / 2;
      const top = window.screenY + window.innerHeight / 2 - height / 2;

      const authWindow = window.open(
        'about:blank',
        undefined,
        `width=${width},height=${height},left=${left},top=${top}`
      );
      if (!authWindow) {
        throw new Error('Popup could not be found.');
      }
      authWindow.document.write(
        `<style>body { margin: 0; }</style><div style="height: 100vh; display: flex; justify-content: center; align-items: center; color: #F5F5F7; background-color: #25252E; font-family: 'Verdana', 'Fira Sans', 'Open Sans', 'Lucida Sans'; font-size: 20px">Loading</div>`
      );
      setupAuthenticationWebSocket({
        onConnectionEstablished: (connectionId) => {
          if (signal && signal.aborted) return;
          const url = new URL(authenticationPortalUrl);
          url.searchParams.set('connection-id', connectionId);
          url.searchParams.set('provider', provider);
          url.searchParams.set('env', isDev ? 'dev' : 'live');

          if (!authWindow) throw new Error('Popup could not be found.');
          authWindow.location = url.toString();
        },
        onTokenReceived: async ({
          provider,
          data,
        }: {
          provider: 'apple' | 'google' | 'github';
          data: any;
        }) => {
          if (signal && signal.aborted) return;
          try {
            let credential;
            if (provider === 'google') {
              credential = GoogleAuthProvider.credential(data.credential);
            } else if (provider === 'github') {
              credential = GithubAuthProvider.credential(data.accessToken);
            } else {
              const appleCredentialOptions: OAuthCredentialOptions & {
                nonce?: string;
              } = {
                idToken: data.id_token,
                // Typescript types declaration indicates the parameter `rawNonce` should be
                // set but it only works with `nonce`.
                nonce: data.raw_nonce,
              };
              credential = new OAuthProvider('apple.com').credential(
                appleCredentialOptions
              );
            }
            await signInWithCredential(this.auth, credential);
            if (authWindow) {
              authWindow.close();
            }
            resolve();
            terminateWebSocket();
          } catch (error) {
            console.error(
              `An error occurred while logging in with ${provider} token:`,
              error
            );
            reject(error);
          }
        },
        onError: (error) => {
          if (signal && signal.aborted) return;
          terminateWebSocket();
          console.error(
            'An error occurred while setting up authentication web socket:',
            error
          );
          reject(
            new Error(
              'An error occurred while setting up authentication web socket.'
            )
          );
        },
        onTimeout: () => {
          if (signal && signal.aborted) return;
          terminateWebSocket();
          console.error('Connection to authorization websocket timed out.');
          reject(new Error('Connection to authorization websocket timed out.'));
        },
      });
    });
    return promise;
  }
}

export default BrowserLoginProvider;
