import type { ColumnDef } from '@tanstack/vue-table'

declare module '@nuxt/ui' {
  export type TableColumn<T = any, D = unknown> = ColumnDef<T, D>
}
