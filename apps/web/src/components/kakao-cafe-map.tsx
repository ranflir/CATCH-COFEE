'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createApiClient } from '@/lib/api';

type MapMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type KakaoMaps = {
  maps: {
    load: (callback: () => void) => void;
    LatLng: new (lat: number, lng: number) => unknown;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
      setCenter: (center: unknown) => void;
      setLevel: (level: number) => void;
      getBounds: () => {
        getSouthWest: () => { getLng: () => number; getLat: () => number };
        getNorthEast: () => { getLng: () => number; getLat: () => number };
      };
    };
    Marker: new (options: { map: unknown; position: unknown; title?: string }) => {
      setMap: (map: unknown | null) => void;
    };
    event: {
      addListener: (target: unknown, type: string, handler: () => void) => void;
    };
  };
};

declare global {
  interface Window {
    kakao?: KakaoMaps;
  }
}

function loadKakaoMaps(appKey: string): Promise<KakaoMaps> {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao?.maps.load(() => {
        if (window.kakao?.maps) resolve(window.kakao);
        else reject(new Error('Kakao Maps SDK 로드 실패'));
      });
    };
    script.onerror = () => reject(new Error('Kakao Maps SDK 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

export function KakaoCafeMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<KakaoMaps['maps']['Map']> | null>(null);
  const markersRef = useRef<Array<InstanceType<KakaoMaps['maps']['Marker']>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapMarker | null>(null);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!appKey) {
      setError('NEXT_PUBLIC_KAKAO_JS_KEY 가 설정되지 않았습니다.');
      return;
    }

    let cancelled = false;
    const client = createApiClient();

    async function fetchMarkers(map: InstanceType<KakaoMaps['maps']['Map']>, kakao: KakaoMaps) {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const bbox = [sw.getLng(), sw.getLat(), ne.getLng(), ne.getLat()].join(',');
      const data = await client.request<{ markers: MapMarker[] }>(
        `/api/v1/cafes/map?bbox=${encodeURIComponent(bbox)}`,
      );

      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = data.markers.map((marker) => {
        const instance = new kakao.maps.Marker({
          map,
          position: new kakao.maps.LatLng(marker.lat, marker.lng),
          title: marker.name,
        });
        kakao.maps.event.addListener(instance, 'click', () => setSelected(marker));
        return instance;
      });
    }

    void (async () => {
      try {
        const kakao = await loadKakaoMaps(appKey);
        if (cancelled || !containerRef.current) return;

        const center = new kakao.maps.LatLng(37.5665, 126.978);
        const map = new kakao.maps.Map(containerRef.current, { center, level: 5 });
        mapRef.current = map;

        const loadMarkers = () => {
          void fetchMarkers(map, kakao).catch(() => {
            if (!cancelled) setError('지도 마커를 불러오지 못했습니다.');
          });
        };

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const nextCenter = new kakao.maps.LatLng(
                pos.coords.latitude,
                pos.coords.longitude,
              );
              map.setCenter(nextCenter);
              map.setLevel(4);
              loadMarkers();
            },
            () => loadMarkers(),
          );
        } else {
          loadMarkers();
        }

        kakao.maps.event.addListener(map, 'idle', loadMarkers);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '카카오맵 초기화 실패');
        }
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  return (
    <div className="stack">
      <div ref={containerRef} className="map-container" aria-label="카페 지도" />
      {error && <p className="error">{error}</p>}
      {selected && (
        <div className="card stack">
          <strong>{selected.name}</strong>
          <Link href={`/cafes/${selected.id}`}>카페 상세 보기</Link>
        </div>
      )}
    </div>
  );
}
