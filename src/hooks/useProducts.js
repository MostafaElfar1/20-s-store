import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PRODUCT_SELECT, normalizeProduct } from '../lib/products'

// Loads all active products (RLS already hides inactive ones from the public).
// `error` is a CODE ('not_connected' | 'load_failed'); pages translate it with t(`err.${error}`).
export function useProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: null })

  const load = useCallback(async () => {
    if (!supabase) {
      setState({ products: [], loading: false, error: 'not_connected' })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase
      .from('products').select(PRODUCT_SELECT).eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) setState({ products: [], loading: false, error: 'load_failed' })
    else setState({ products: data.map(normalizeProduct), loading: false, error: null })
  }, [])

  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}
