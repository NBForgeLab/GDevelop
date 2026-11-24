import type { Auth } from 'firebase/auth';
import type { IdentityProvider } from '../Utils/GDevelopServices/Authentication';

export interface LoginProvider {
  loginWithEmailAndPassword(arg0: {
    email: string;
    password: string;
  }): Promise<void>;
  loginOrSignupWithProvider(arg0: {
    provider: IdentityProvider;
    signal?: AbortSignal;
  }): Promise<void>;
}

export interface FirebaseBasedLoginProvider {
  auth: Auth;
}
