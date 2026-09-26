import { getRouteApi, type RegisteredRouter, type RouteIds } from '@tanstack/react-router'

function cleanEmptyParams<T extends Record<string, unknown>>(search: T): T {
  const cleaned = { ...search }
  for (const key of Object.keys(cleaned)) {
    const value = cleaned[key]
    if (value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
      delete cleaned[key]
    }
  }
  return cleaned
}

export function useFilters<T extends RouteIds<RegisteredRouter['routeTree']>>(routeId: T) {
  const routeApi = getRouteApi<T>(routeId)
  const navigate = routeApi.useNavigate()
  const filters = routeApi.useSearch()

  function setFilters(partialFilters: Partial<typeof filters>) {
    navigate({
      search: (prev) => cleanEmptyParams({ ...prev, ...partialFilters }),
      replace: true,
    } as Parameters<typeof navigate>[0])
  }

  function resetFilters() {
    navigate({ search: {}, replace: true } as Parameters<typeof navigate>[0])
  }

  return { filters, setFilters, resetFilters }
}
