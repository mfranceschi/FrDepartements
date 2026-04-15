import { useState } from 'react';
import AccordionRegions from '../components/tableau/AccordionRegions';
import TableauFlat from '../components/tableau/TableauFlat';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';

type Tab = 'regions' | 'liste';

export default function TableauPage() {
  const [activeTab, setActiveTab] = useState<Tab>('liste');

  return (
    <main className="flex-1 min-h-0 overflow-y-auto"><div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Départements français
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {DEPARTEMENTS.length} départements répartis en {REGIONS.length} régions
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {(['regions', 'liste'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              activeTab === tab
                ? { backgroundColor: '#2563eb', color: '#fff' }
                : { color: 'var(--text-secondary)', backgroundColor: 'transparent' }
            }
          >
            {tab === 'regions' ? 'Par région' : 'Liste complète'}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === 'regions' ? <AccordionRegions /> : <TableauFlat />}
    </div></main>
  );
}
