import { NavLink } from 'react-router-dom';

const links = [
  { to: '/quiz', label: 'Quiz' },
  { to: '/carte', label: 'Carte' },
  { to: '/tableau', label: 'Tableau' },
];

export default function Nav() {
  return (
    <nav className="flex gap-4 px-6 py-3 border-b border-gray-200 bg-white">
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
  );
}
