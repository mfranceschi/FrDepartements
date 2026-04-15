import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const links = [
  {
    to: '/quiz',
    label: 'Quiz',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    to: '/carte',
    label: 'Carte',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    to: '/tableau',
    label: 'Tableau',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
  {
    to: '/stats',
    label: 'Stats',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
];

export default function Nav() {
  return (
    <>
      {/* Top bar — toujours visible */}
      <nav
        aria-label="Navigation principale"
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex gap-4">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className="pb-1 font-medium transition-colors"
              style={({ isActive }) =>
                isActive
                  ? { color: '#2563eb', borderBottom: '2px solid #2563eb' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <ThemeToggle />
      </nav>

      {/* Bottom bar — mobile uniquement (lg:hidden) */}
      <nav aria-label="Navigation mobile" aria-hidden="true" className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors"
            style={({ isActive }) =>
              isActive ? { color: '#2563eb' } : { color: 'var(--text-secondary)' }
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
