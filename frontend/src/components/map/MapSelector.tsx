import { useEffect, useRef } from 'react';
import {
    MapContainer,
    TileLayer,
    Polygon,
    Marker,
    useMapEvents,
    useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon broken by Vite/Webpack asset pipeline
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: markerIconUrl,
    shadowUrl: markerShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Small numbered circle icon for polygon vertices
const vertexIcon = (index: number, isDragging?: boolean) =>
    L.divIcon({
        className: '',
        html: `<div style="
            width: 26px; height: 26px; border-radius: 50%;
            background: ${isDragging ? '#0284c7' : '#059669'}; border: 2.5px solid white;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 11px; font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.45);
            cursor: grab;
            transition: background 0.15s;
        ">${index + 1}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
    });

// Esri World Imagery tile URL (no API key required for basic usage)
const ESRI_SATELLITE =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS =
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

interface Props {
    /** [[lng, lat], ...] closed polygon or null */
    value: number[][] | null;
    /** receives [[lng, lat], ...] with first == last */
    onChange: (coords: number[][] | null) => void;
    /** fired with calculated area in hectares whenever polygon has 3+ points */
    onAreaCalculated?: (ha: number) => void;
    /** override the map container height — defaults to 'clamp(240px, 35vh, 360px)' */
    mapHeight?: string;
}

/** Geodesic polygon area using the spherical excess formula. Returns hectares. */
function computeAreaHa(pts: [number, number][]): number {
    if (pts.length < 3) return 0;
    const R = 6371000; // Earth radius in metres
    const toRad = (d: number) => (d * Math.PI) / 180;
    let area = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = toRad(pts[i][0]);
        const lat2 = toRad(pts[j][0]);
        const dLng = toRad(pts[j][1] - pts[i][1]);
        area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((area * R * R) / 2) / 10_000; // m² → ha
}

/** Converts internal [[lat, lng]] to backend [[lng, lat]] and closes the ring */
function toBackendClosed(points: [number, number][]): number[][] {
    if (points.length < 3) return [];
    const backend = points.map(([lat, lng]) => [lng, lat]);
    // close the ring
    backend.push([...backend[0]]);
    return backend;
}

/** Converts backend [[lng, lat]] back to Leaflet [[lat, lng]] */
function fromBackend(coords: number[][]): [number, number][] {
    if (!coords || coords.length < 4) return [];
    // Drop the last closing point for editing
    return coords.slice(0, -1).map(([lng, lat]) => [lat, lng]);
}

// ── Click handler component living inside the MapContainer ───────────────────
function DrawHandler({
    points,
    setPoints,
    finished,
}: {
    points: [number, number][];
    setPoints: (p: [number, number][]) => void;
    finished: boolean;
}) {
    useMapEvents({
        click(e) {
            if (finished) return;
            // Ignore clicks that originated from a Leaflet control (e.g. zoom +/- buttons)
            const target = e.originalEvent.target as HTMLElement;
            if (target.closest('.leaflet-control')) return;
            setPoints([...points, [e.latlng.lat, e.latlng.lng]]);
        },
    });
    return null;
}

// ── Locate-me button that lives inside the MapContainer so it can access useMap
function LocateButton({ title }: { title: string }) {
    const map = useMap();
    const [locating, setLocating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use Leaflet's own API to prevent clicks from reaching the map click handler
    useEffect(() => {
        if (containerRef.current) {
            L.DomEvent.disableClickPropagation(containerRef.current);
        }
    }, []);

    const handleLocate = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.2 });
                setLocating(false);
            },
            () => { setLocating(false); },
            { timeout: 8000 }
        );
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                bottom: '80px',
                right: '10px',
                zIndex: 1000,
            }}
        >
            <button
                onClick={handleLocate}
                disabled={locating}
                title={title}
                style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '4px',
                    background: 'white',
                    border: '2px solid rgba(0,0,0,0.2)',
                    cursor: locating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 5px rgba(0,0,0,0.35)',
                    opacity: locating ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                    padding: 0,
                }}
            >
                <LocateFixed
                    size={16}
                    color={locating ? '#059669' : '#333'}
                    style={{ display: 'block' }}
                />
            </button>
        </div>
    );
}

// ── Main MapSelector component ────────────────────────────────────────────────
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Trash2, CheckCheck, Undo2, MapPin, LocateFixed, Ruler } from 'lucide-react';

export const MapSelector = ({ value, onChange, onAreaCalculated, mapHeight = 'clamp(240px, 35vh, 360px)' }: Props) => {
    const { t } = useTranslation();
    const [points, setPoints] = useState<[number, number][]>(
        value ? fromBackend(value) : []
    );
    const [finished, setFinished] = useState<boolean>(value != null && value.length >= 4);

    // Keep internal state in sync if value is externally reset (e.g. form close)
    useEffect(() => {
        if (!value) {
            setPoints([]);
            setFinished(false);
        }
    }, [value]);

    const handleSetPoints = (newPoints: [number, number][]) => {
        setPoints(newPoints);
        if (newPoints.length >= 3) {
            onAreaCalculated?.(computeAreaHa(newPoints));
        }
        if (finished) {
            onChange(toBackendClosed(newPoints));
        }
    };

    const handleFinish = () => {
        if (points.length < 3) return;
        setFinished(true);
        onChange(toBackendClosed(points));
        onAreaCalculated?.(computeAreaHa(points));
    };

    // Edit: just unlocks for dragging/adding — does NOT clear the polygon
    const handleUndo = () => {
        if (finished) {
            setFinished(false);
            return;
        }
        const newPoints = points.slice(0, -1);
        setPoints(newPoints);
        if (newPoints.length === 0) onChange(null);
    };

    // Clear: wipes everything so user can redraw from scratch
    const handleClear = () => {
        setPoints([]);
        setFinished(false);
        onChange(null);
    };

    const center: [number, number] =
        points.length > 0 ? points[0] : [38.9637, 35.2433];

    const liveAreaHa = points.length >= 3 ? computeAreaHa(points) : null;

    return (
        <Box
            borderRadius="xl"
            overflow="hidden"
            border="2px solid"
            borderColor={finished ? '#059669' : 'gray.300'}
            transition="border-color 0.3s"
            position="relative"
            display="flex"
            flexDirection="column"
            h="full"
        >
            {/* ── Toolbar ───────────────────────────────────────────────── */}
            <Flex
                position="absolute"
                top="10px"
                right="10px"
                zIndex={1000}
                gap={2}
                direction="column"
                align="flex-end"
            >
                {/* Status badge */}
                <Flex
                    bg="rgba(0,0,0,0.65)"
                    color="white"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    align="center"
                    gap={1.5}
                    backdropFilter="blur(6px)"
                >
                    <MapPin size={12} />
                    {finished
                        ? `Boundary locked — ${liveAreaHa != null ? liveAreaHa.toFixed(2) : '?'} ha`
                        : points.length === 0
                            ? 'Click map to start drawing'
                            : points.length < 3
                                ? `${points.length} / 3 min. points`
                                : `${points.length} pts — ~${liveAreaHa?.toFixed(2)} ha`}
                </Flex>

                {/* Buttons */}
                <Flex gap={2}>
                    {points.length > 0 && (
                        <Button
                            size="xs"
                            onClick={handleUndo}
                            bg="rgba(0,0,0,0.6)"
                            color="white"
                            _hover={{ bg: 'rgba(0,0,0,0.8)' }}
                            borderRadius="lg"
                            backdropFilter="blur(6px)"
                            gap={1}
                        >
                            <Undo2 size={13} />
                            {finished ? 'Edit' : 'Undo'}
                        </Button>
                    )}
                    {/* Always show Clear when polygon exists so users know they can redraw */}
                    {points.length > 0 && (
                        <Button
                            size="xs"
                            onClick={handleClear}
                            bg="rgba(220,38,38,0.75)"
                            color="white"
                            _hover={{ bg: 'rgba(220,38,38,1)' }}
                            borderRadius="lg"
                            backdropFilter="blur(6px)"
                            gap={1}
                        >
                            <Trash2 size={13} />
                            Clear
                        </Button>
                    )}
                    {points.length >= 3 && !finished && (
                        <Button
                            size="xs"
                            onClick={handleFinish}
                            bg="#059669"
                            color="white"
                            _hover={{ bg: '#047857' }}
                            borderRadius="lg"
                            backdropFilter="blur(6px)"
                            gap={1}
                        >
                            <CheckCheck size={13} />
                            Finish
                        </Button>
                    )}
                </Flex>

            </Flex>

            {/* ── Map ───────────────────────────────────────────────────── */}
            <MapContainer
                center={center}
                zoom={points.length > 0 ? 14 : 6}
                style={{ height: mapHeight, width: '100%', cursor: finished ? 'default' : 'crosshair' }}
                scrollWheelZoom
            >
                {/* Esri Satellite base layer */}
                <TileLayer
                    url={ESRI_SATELLITE}
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    maxZoom={19}
                />
                {/* Esri label overlay */}
                <TileLayer
                    url={ESRI_LABELS}
                    attribution=""
                    maxZoom={19}
                    opacity={0.8}
                />

                {/* Click handler */}
                <DrawHandler
                    points={points}
                    setPoints={handleSetPoints}
                    finished={finished}
                />

                {/* Locate me button */}
                <LocateButton title={t('map.locate_me')} />

                {/* Drawn polygon */}
                {points.length >= 2 && (
                    <Polygon
                        positions={points}
                        pathOptions={{
                            color: '#059669',
                            fillColor: '#059669',
                            fillOpacity: 0.2,
                            weight: 2,
                            dashArray: finished ? undefined : '6 4',
                        }}
                    />
                )}

                {/* Vertex markers — stable key so React never remounts during drag */}
                {points.map((pt, i) => (
                    <Marker
                        key={i}
                        position={pt}
                        icon={vertexIcon(i)}
                        draggable={true}
                        eventHandlers={{
                            dragend(e) {
                                const pos = (e.target as L.Marker).getLatLng();
                                const newPoints: [number, number][] = points.map((p, idx) =>
                                    idx === i ? [pos.lat, pos.lng] : p
                                );
                                handleSetPoints(newPoints);
                                if (finished) onChange(toBackendClosed(newPoints));
                            },
                        }}
                    />
                ))}
            </MapContainer>

            {/* Bottom hint bar */}
            <Flex
                bg={finished ? '#ecfdf5' : '#f8fafc'}
                borderTop="1px solid"
                borderColor={finished ? '#a7f3d0' : 'gray.200'}
                px={4}
                py={2}
                align="center"
                justify="space-between"
                gap={2}
            >
                {finished ? (
                    <>
                        <Flex align="center" gap={2}>
                            <CheckCheck size={14} color="#059669" />
                            <Text fontSize="xs" color="#059669" fontWeight="medium">
                                Boundary saved — {points.length} points. Drag any corner to adjust, or use
                                {' '}<strong>Edit</strong> to add more points /{' '}
                                <strong>Clear</strong> to redraw.
                            </Text>
                        </Flex>
                        {liveAreaHa != null && (
                            <Flex align="center" gap={1}>
                                <Ruler size={12} color="#059669" />
                                <Text fontSize="xs" color="#059669" fontWeight="bold" whiteSpace="nowrap">
                                    {liveAreaHa.toFixed(4)} ha
                                </Text>
                            </Flex>
                        )}
                    </>
                ) : (
                    <>
                        <Text fontSize="xs" color="gray.500">
                            {points.length === 0
                                ? 'Click on the satellite map to place your first field corner.'
                                : points.length < 3
                                    ? `${points.length} point${points.length > 1 ? 's' : ''} placed — add at least ${3 - points.length} more to form a polygon.`
                                    : `${points.length} points placed. Add more corners or press “Finish” to lock the boundary.`
                            }
                        </Text>
                        {liveAreaHa != null && (
                            <Text fontSize="xs" color="blue.500" fontWeight="semibold" whiteSpace="nowrap">
                                ~{liveAreaHa.toFixed(2)} ha
                            </Text>
                        )}
                    </>
                )}
            </Flex>
        </Box>
    );
};

export default MapSelector;
