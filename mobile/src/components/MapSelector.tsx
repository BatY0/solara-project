import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { MapPin, Trash2, Undo2, CheckCheck, Locate } from 'lucide-react-native';
import * as Location from 'expo-location';
import { computeAreaHa, toBackendClosed, fromBackend } from '../utils/geo';
import { theme } from '../theme/theme';

export type Point = [number, number]; // [lat, lng]

interface MapSelectorProps {
    /** Backend format: [[lng, lat], ...] closed polygon or null */
    value: number[][] | null;
    /** Receives [[lng, lat], ...] with first === last */
    onChange: (coords: number[][] | null) => void;
    /** Called with area in hectares when polygon has 3+ points */
    onAreaCalculated?: (ha: number) => void;
}

const DEFAULT_REGION = {
    latitude: 38.9637,
    longitude: 35.2433,
    latitudeDelta: 8,
    longitudeDelta: 8,
};

export function MapSelector({ value, onChange, onAreaCalculated }: MapSelectorProps) {
    const { t } = useTranslation();
    const [points, setPoints] = useState<Point[]>(value ? fromBackend(value) : []);
    const [finished, setFinished] = useState(value != null && value.length >= 4);
    const [locating, setLocating] = useState(false);
    const mapRef = React.useRef<MapView>(null);

    useEffect(() => {
        if (!value) {
            setPoints([]);
            setFinished(false);
        } else {
            // When an existing polygon is passed in (e.g. Edit tapped),
            // animate the map to fit it instead of staying at the default region.
            const loaded = fromBackend(value);
            if (loaded.length > 0) {
                const coords = loaded.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
                const t = setTimeout(() => {
                    mapRef.current?.fitToCoordinates(coords, {
                        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                        animated: true,
                    });
                }, 350);
                return () => clearTimeout(t);
            }
        }
    }, [value]);

    const handleSetPoints = useCallback(
        (newPoints: Point[]) => {
            setPoints(newPoints);
            if (newPoints.length >= 3) {
                onAreaCalculated?.(computeAreaHa(newPoints));
            }
            if (finished) {
                onChange(toBackendClosed(newPoints));
            }
        },
        [onAreaCalculated, onChange, finished]
    );

    const handleMapPress = useCallback(
        (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
            if (finished) return;
            const { latitude, longitude } = e.nativeEvent.coordinate;
            handleSetPoints([...points, [latitude, longitude]]);
        },
        [points, finished, handleSetPoints]
    );

    const handleVertexDrag = useCallback((index: number, e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        const newPoints = [...points];
        newPoints[index] = [latitude, longitude];
        handleSetPoints(newPoints);
    }, [points, handleSetPoints]);

    const handleFinish = useCallback(() => {
        if (points.length < 3) return;
        setFinished(true);
        onChange(toBackendClosed(points));
        onAreaCalculated?.(computeAreaHa(points));
    }, [points, onChange, onAreaCalculated]);

    const handleUndo = useCallback(() => {
        if (finished) {
            setFinished(false);
            onChange(null);
            return;
        }
        const newPoints = points.slice(0, -1);
        setPoints(newPoints);
        if (newPoints.length === 0) onChange(null);
    }, [points, finished, onChange]);

    const handleClear = useCallback(() => {
        setPoints([]);
        setFinished(false);
        onChange(null);
    }, [onChange]);

    const handleLocate = useCallback(async () => {
        try {
            setLocating(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = loc.coords;
            mapRef.current?.animateToRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } finally {
            setLocating(false);
        }
    }, []);

    let initialRegion = DEFAULT_REGION;
    if (points.length > 0) {
        const lats = points.map(p => p[0]);
        const lngs = points.map(p => p[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        initialRegion = {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max((maxLat - minLat) * 2, 0.001),
            longitudeDelta: Math.max((maxLng - minLng) * 2, 0.001),
        };
    }

    const polygonCoords =
        points.length >= 2
            ? points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
            : [];

    const liveAreaHa = points.length >= 3 ? computeAreaHa(points) : null;

    return (
        <View style={[styles.wrapper, finished && styles.wrapperLocked]}>
            {/* Toolbar */}
            <View style={styles.toolbar}>
                <View style={styles.statusBadge}>
                    <MapPin size={12} color="#fff" />
                    <Text style={styles.statusText}>
                        {finished
                            ? t('map.status_locked', { area: liveAreaHa != null ? liveAreaHa.toFixed(2) : '?' })
                            : points.length < 3
                              ? t('map.status_add_points', { count: points.length })
                              : t('map.status_ready', { count: points.length, area: liveAreaHa?.toFixed(2) })}
                    </Text>
                </View>
                <View style={styles.buttons}>
                    {points.length > 0 && (
                        <TouchableOpacity style={styles.btnUndo} onPress={handleUndo}>
                            <Undo2 size={14} color="#fff" />
                        </TouchableOpacity>
                    )}
                    {points.length > 0 && !finished && (
                        <TouchableOpacity style={styles.btnClear} onPress={handleClear}>
                            <Trash2 size={14} color="#fff" />
                        </TouchableOpacity>
                    )}
                    {points.length >= 3 && !finished && (
                        <TouchableOpacity style={styles.btnFinish} onPress={handleFinish}>
                            <CheckCheck size={14} color="#fff" />
                            <Text style={styles.btnFinishText}>{t('map.finish')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                onPress={handleMapPress}
                mapType="satellite"
                provider={PROVIDER_DEFAULT}
                showsUserLocation
                showsMyLocationButton={false}
            >
                {polygonCoords.length >= 2 && (
                    <Polygon
                        coordinates={polygonCoords}
                        fillColor="rgba(5, 150, 105, 0.2)"
                        strokeColor="#059669"
                        strokeWidth={2}
                    />
                )}
                {points.map(([lat, lng], i) => (
                    <Marker
                        key={i}
                        coordinate={{ latitude: lat, longitude: lng }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        draggable={true}
                        onDragEnd={(e) => handleVertexDrag(i, e)}
                    >
                        <View style={styles.vertexMarker}>
                            <Text style={styles.vertexLabel}>{i + 1}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Locate button */}
            <TouchableOpacity
                style={styles.locateBtn}
                onPress={handleLocate}
                disabled={locating}
            >
                <Locate size={16} color={locating ? '#059669' : '#333'} />
            </TouchableOpacity>

            {/* Hint bar */}
            <View style={[styles.hintBar, finished && styles.hintBarLocked]}>
                {finished ? (
                    <>
                        <View style={styles.hintRow}>
                            <CheckCheck size={14} color="#059669" />
                            <Text style={styles.hintTextLocked}>
                                {t('map.boundary_saved', { count: points.length })}
                            </Text>
                        </View>
                        {liveAreaHa != null && (
                            <Text style={styles.areaText}>📏 {liveAreaHa.toFixed(4)} ha</Text>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={styles.hintText}>
                            {points.length < 3
                                ? t('map.click_hint_few')
                                : t('map.click_hint_enough')}
                        </Text>
                        {liveAreaHa != null && (
                            <Text style={styles.areaTextLive}>~{liveAreaHa.toFixed(2)} ha</Text>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#d1d5db',
    },
    wrapperLocked: {
        borderColor: '#059669',
    },
    toolbar: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        alignItems: 'flex-end',
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
    },
    btnUndo: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnClear: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: 'rgba(220,38,38,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnFinish: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#059669',
        justifyContent: 'center',
    },
    btnFinishText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    map: {
        width: '100%',
        height: 280,
    },
    locateBtn: {
        position: 'absolute',
        bottom: 90,
        left: 10,
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.35, shadowRadius: 5 },
            android: { elevation: 4 },
        }),
    },
    hintBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        gap: 8,
    },
    hintBarLocked: {
        backgroundColor: '#ecfdf5',
        borderTopColor: '#a7f3d0',
    },
    hintText: {
        fontSize: 11,
        color: '#64748b',
        flex: 1,
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    hintTextLocked: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '600',
    },
    areaText: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '700',
    },
    areaTextLive: {
        fontSize: 11,
        color: theme.colors.accent[500],
        fontWeight: '600',
    },
    vertexMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#059669',
        borderWidth: 2,
        borderColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    vertexLabel: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
});

export default MapSelector;
