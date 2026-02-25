package com.solara.backend.utils;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;

import java.util.List;

public class GeometryUtil {

    private static final GeometryFactory geometryFactory =
            new GeometryFactory(new PrecisionModel(), 4326);

    /**
     * Creates a Polygon from a list of [longitude, latitude] coordinate pairs.
     * The list must form a closed ring (first == last).
     */
    public static Polygon createPolygon(List<List<Double>> coords) {
        Coordinate[] coordinates = coords.stream()
                .map(c -> new Coordinate(c.get(0), c.get(1))) // lng, lat
                .toArray(Coordinate[]::new);
        return geometryFactory.createPolygon(coordinates);
    }

    public static GeometryFactory getGeometryFactory() {
        return geometryFactory;
    }
}
