import { useState } from 'react';
import AccordionRegions from '../components/tableau/AccordionRegions';
import TableauFlat from '../components/tableau/TableauFlat';

type Tab = 'regions' | 'liste';

export default function TableauPage() {
  const [activeTab, setActiveTab] = useState<Tab>('regions');

  const tabClass = (tab: Tab) =>
    [
      'px-5 py-2 rounded-lg text-sm font-medium transition-colors',
      activeTab === tab
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-100',
    ].join(' ');

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Départements français
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          101 départements répartis en 18 régions
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          className={tabClass('regions')}
          onClick={() => setActiveTab('regions')}
        >
          Par région
        </button>
        <button
          type="button"
          className={tabClass('liste')}
          onClick={() => setActiveTab('liste')}
        >
          Liste complète
        </button>
      </div>

      {/* Contenu */}
      {activeTab === 'regions' ? <AccordionRegions /> : <TableauFlat />}
    </main>
  );
}
