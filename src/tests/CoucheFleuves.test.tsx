import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import CoucheFleuves from '../components/carte/CoucheFleuves';
import type { Feature } from 'geojson';
import type { D3PathGen } from '../components/carte/featureStyle';

// pathGen minimal : retourne un chemin fictif et un centroïde valide
const mockPathGen = Object.assign(
  () => 'M0 0 L10 10',
  {
    centroid: (): [number, number] => [50, 50],
    bounds: (): [[number, number], [number, number]] => [[0, 0], [100, 100]],
  },
) as unknown as D3PathGen;

const features: Feature[] = [
  {
    type: 'Feature',
    properties: { name: 'Loire', ne_id: 'loire-1', scalerank: 2 },
    geometry: { type: 'LineString', coordinates: [[0, 47], [2, 47]] },
  },
  {
    type: 'Feature',
    properties: { name: 'Rhône', ne_id: 'rhone-1', scalerank: 2 },
    geometry: { type: 'LineString', coordinates: [[4, 45], [5, 44]] },
  },
];

describe('CoucheFleuves', () => {
  it('ne rend rien si visible=false', () => {
    const { container } = render(
      <svg>
        <CoucheFleuves
          features={features}
          pathGen={mockPathGen}
          visible={false}
          onHover={vi.fn()}
        />
      </svg>,
    );
    expect(container.querySelector('.couche-fleuves')).toBeNull();
  });

  it('rend le groupe .couche-fleuves si visible=true', () => {
    const { container } = render(
      <svg>
        <CoucheFleuves
          features={features}
          pathGen={mockPathGen}
          visible={true}
          onHover={vi.fn()}
        />
      </svg>,
    );
    expect(container.querySelector('.couche-fleuves')).not.toBeNull();
  });

  it('rend une zone de hit par feature', () => {
    const { container } = render(
      <svg>
        <CoucheFleuves
          features={features}
          pathGen={mockPathGen}
          visible={true}
          onHover={vi.fn()}
        />
      </svg>,
    );
    // Les zones de hit sont des <path> avec stroke transparent
    const hitPaths = Array.from(container.querySelectorAll('path[stroke="transparent"]'));
    expect(hitPaths.length).toBe(features.length);
  });

  it('appelle onHover avec le nom au survol d\'une zone de hit', () => {
    const onHover = vi.fn();
    const { container } = render(
      <svg>
        <CoucheFleuves
          features={features}
          pathGen={mockPathGen}
          visible={true}
          onHover={onHover}
        />
      </svg>,
    );
    const hitPath = container.querySelector('path[stroke="transparent"]')!;
    fireEvent.mouseEnter(hitPath);
    expect(onHover).toHaveBeenCalledWith('Loire', expect.any(Number), expect.any(Number));
  });

  it('appelle onHover avec null au départ de la zone de hit', () => {
    const onHover = vi.fn();
    const { container } = render(
      <svg>
        <CoucheFleuves
          features={features}
          pathGen={mockPathGen}
          visible={true}
          onHover={onHover}
        />
      </svg>,
    );
    const hitPath = container.querySelector('path[stroke="transparent"]')!;
    fireEvent.mouseLeave(hitPath);
    expect(onHover).toHaveBeenCalledWith(null, 0, 0);
  });
});
