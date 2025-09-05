declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Basic Vite client types to avoid import errors
interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  [key: string]: any
}