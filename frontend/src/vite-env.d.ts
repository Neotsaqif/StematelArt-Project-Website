/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIDTRANS_ENV?: string;
  readonly VITE_MIDTRANS_SNAP_URL?: string;
  readonly VITE_MIDTRANS_CLIENT_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
