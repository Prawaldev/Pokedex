import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './Footer'

/** Shared chrome for every route: skip link, page shell, footer, scroll reset. */
export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div id="top" className="page">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <main id="main" className="shell layout">
        <Outlet />
        <Footer />
      </main>
    </div>
  )
}
