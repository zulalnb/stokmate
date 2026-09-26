import { Search } from 'lucide-react'

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'

export function ProductSearchBar({
  q,
  onSearchChange,
  className
}: {
  q?: string
  onSearchChange: (value: string) => void
  className?: string
}) {
  const debouncedSearchChange = useDebouncedCallback(onSearchChange, 500)

  return (
    <InputGroup className={className}>
      <InputGroupInput
        key={q ?? 'empty'}
        defaultValue={q ?? ''}
        onChange={(e) => debouncedSearchChange(e.target.value)}
        placeholder="Ürün ara…"
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  )
}
