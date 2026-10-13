import React, { useState } from 'react'
import {
  Sparkles,
  Compass,
  Hammer,
  LayoutDashboard,
  Menu,
  X,
  Activity,
} from 'lucide-react'

export type NavTab = 'home' | 'problem' | 'board' | 'builder' | 'dashboard'

interface NavbarProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Overview', icon: <Compass size={16} /> },
    { id: 'problem', label: 'I Have a Problem', icon: <Sparkles size={16} /> },
    { id: 'board', label: 'Problems Board', icon: <Activity size={16} /> },
    { id: 'builder', label: 'I Am a Builder', icon: <Hammer size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  ]

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab)
    setMobileMenuOpen(false)
  }

  return (
    <header
      style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 'var(--nav-height)',
        }}
      >
        {/* Logo and Brand */}
        <div
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavClick('home')}
        >
          <img
            src="/logo.png"
            alt="HatchMatch Logo"
            style={{
              height: '38px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-charcoal-strong)',
              letterSpacing: '-0.02em',
            }}
          >
            HatchMatch
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: 'none',
            gap: '0.25rem',
            alignItems: 'center',
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  padding: '0.5rem 0.875rem',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Mobile Menu Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'none',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-charcoal)',
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'var(--color-white)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  justifyContent: 'flex-start',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9375rem',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
