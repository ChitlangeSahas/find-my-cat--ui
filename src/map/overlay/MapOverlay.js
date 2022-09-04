import { useId, useEffect } from 'react';
import usePersistedState from '../../common/util/usePersistedState';
import { map } from '../core/MapView';
import useMapOverlays from './useMapOverlays';

const MapOverlay = () => {
  const id = useId();

  const mapOverlays = useMapOverlays();
  const [selectedMapOverlay] = usePersistedState('selectedMapOverlay');

  const activeOverlay = mapOverlays.filter((overlay) => overlay.available).find((overlay) => overlay.id === selectedMapOverlay);

  useEffect(() => {
    if (activeOverlay) {
      map.addSource(id, activeOverlay.source);
      map.addLayer({
        id,
        type: 'raster',
        source: id,
        layout: {
          visibility: 'visible',
        },
      });
    }
    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  });

  return null;
};

export default MapOverlay;
