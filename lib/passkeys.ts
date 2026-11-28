import api from './api';
import type { User } from './auth';

export interface PasskeyRow {
  id: number;
  name: string;
  transports: string[] | null;
  last_used_at: string | null;
  created_at: string;
}

// The server sends and expects binary fields as base64url strings.
function fromB64url(value: string): ArrayBuffer {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function toB64url(buffer: ArrayBuffer | null | undefined): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Whether this browser can use passkeys at all. */
export function passkeysSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;
}

/** A friendly message for the errors browsers throw when the user cancels or it can't work. */
export function passkeyErrorMessage(err: any, fallback: string): string {
  if (err?.name === 'NotAllowedError') return 'Cancelled, or no passkey was chosen.';
  if (err?.name === 'InvalidStateError') return 'This device already has a passkey for your account.';
  if (err?.name === 'SecurityError') return 'Passkeys only work on the Spotlighticket website.';
  return err?.response?.data?.message || fallback;
}

export const passkeys = {
  async list(): Promise<PasskeyRow[]> {
    const { data } = await api.get('/passkeys');
    return data;
  },

  /** Creates a passkey on this device (Face ID, fingerprint, PIN or a security key) and saves it. */
  async add(name?: string): Promise<PasskeyRow> {
    const { data: options } = await api.post('/passkeys/options');
    const pk = options.publicKey;
    const credential = (await navigator.credentials.create({
      publicKey: {
        ...pk,
        challenge: fromB64url(pk.challenge),
        user: { ...pk.user, id: fromB64url(pk.user.id) },
        excludeCredentials: (pk.excludeCredentials ?? []).map((c: any) => ({ ...c, id: fromB64url(c.id) })),
      },
    })) as PublicKeyCredential | null;
    if (!credential) throw new Error('No passkey was created.');

    const response = credential.response as AuthenticatorAttestationResponse;
    const { data } = await api.post('/passkeys', {
      name,
      clientDataJSON: toB64url(response.clientDataJSON),
      attestationObject: toB64url(response.attestationObject),
      transports: typeof response.getTransports === 'function' ? response.getTransports() : undefined,
    });
    return data;
  },

  async rename(id: number, name: string): Promise<PasskeyRow> {
    const { data } = await api.put(`/passkeys/${id}`, { name });
    return data;
  },

  async remove(id: number) {
    await api.delete(`/passkeys/${id}`);
  },

  /** Signs in with whichever passkey the browser offers; stores the token like password login. */
  async signIn(): Promise<User> {
    const { data: start } = await api.post('/passkeys/login/options');
    const pk = start.options.publicKey;
    const credential = (await navigator.credentials.get({
      publicKey: {
        ...pk,
        challenge: fromB64url(pk.challenge),
        allowCredentials: (pk.allowCredentials ?? []).map((c: any) => ({ ...c, id: fromB64url(c.id) })),
      },
    })) as PublicKeyCredential | null;
    if (!credential) throw new Error('No passkey was chosen.');

    const response = credential.response as AuthenticatorAssertionResponse;
    const { data } = await api.post('/passkeys/login', {
      token: start.token,
      id: credential.id,
      clientDataJSON: toB64url(response.clientDataJSON),
      authenticatorData: toB64url(response.authenticatorData),
      signature: toB64url(response.signature),
      userHandle: toB64url(response.userHandle),
    });
    localStorage.setItem('token', data.token);
    return data.user;
  },
};
