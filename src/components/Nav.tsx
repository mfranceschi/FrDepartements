import { NavLink } from 'react-router-dom';

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
];

export default function Nav() {
  return (
    <>
      {/* Top bar — toujours visible */}
      <nav aria-label="Navigation principale" className="flex gap-4 px-6 py-3 border-b border-gray-200 bg-white">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'font-semibold text-blue-600 border-b-2 border-blue-600 pb-1'
                : 'text-gray-600 hover:text-gray-900 pb-1'
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom bar — mobile uniquement (lg:hidden) */}
      <nav aria-label="Navigation mobile" aria-hidden="true" className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
