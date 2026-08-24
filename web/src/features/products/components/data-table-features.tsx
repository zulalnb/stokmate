import { metaHelper, rowSortingFeature, tableFeatures } from '@tanstack/react-table'

type ProductColumnMeta = { className?: string }

export const features = tableFeatures({
  columnMeta: metaHelper<ProductColumnMeta>(),
  rowSortingFeature,
})

export type DataTableFeatures = typeof features