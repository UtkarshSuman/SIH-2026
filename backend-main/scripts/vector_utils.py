import geopandas as gpd
import pandas as pd
import rasterio
from rasterio.features import shapes
from shapely.geometry import shape


def polygonize_raster(raster_path, output_path, target_classes=None):
    with rasterio.open(raster_path) as src:
        image = src.read(1)
        transform = src.transform
        crs = src.crs

        results = (
            {"geometry": shape(geom), "class": val}
            for geom, val in shapes(image, mask=image != 0, transform=transform)
        )
        gdf = gpd.GeoDataFrame.from_records(results)
        gdf.set_geometry("geometry", inplace=True)
        gdf.set_crs(crs, inplace=True)

        if target_classes:
            gdf = gdf[gdf["class"].isin(target_classes)]

        gdf.to_file(output_path, driver="GPKG")
    print(f"Polygonized vector saved to {output_path} ({len(gdf)} features)")
    return gdf

def reproject_villages(input_path, output_path, target_crs):
    gdf = gpd.read_file(input_path)
    gdf["lon_wgs84"] = gdf.geometry.centroid.x
    gdf["lat_wgs84"] = gdf.geometry.centroid.y
    gdf = gdf.to_crs(target_crs)
    gdf.to_file(output_path, driver="GPKG")
    print(f"Reprojected villages saved to {output_path}")
    return gdf

def dissolve_zones(input_path, output_path, by=None, chunk_size=20000):
    gdf = gpd.read_file(input_path)
    if by:
        dissolved = gdf.dissolve(by=by)
    else:
        chunks = [gdf.iloc[i:i + chunk_size] for i in range(0, len(gdf), chunk_size)]
        chunk_unions = [gpd.GeoDataFrame(geometry=[c.unary_union], crs=gdf.crs) for c in chunks]
        combined = gpd.GeoDataFrame(pd.concat(chunk_unions, ignore_index=True), crs=gdf.crs)
        dissolved = gpd.GeoDataFrame(geometry=[combined.unary_union], crs=gdf.crs)
    dissolved = dissolved.explode(index_parts=False).reset_index(drop=True)
    dissolved.to_file(output_path, driver="GPKG")
    print(f"Dissolved zones saved to {output_path} ({len(dissolved)} features)")
    return dissolved


def buffer_villages(villages_path, output_path, distance_m):
    gdf = gpd.read_file(villages_path)
    gdf["geometry"] = gdf.geometry.buffer(distance_m)
    gdf.to_file(output_path, driver="GPKG")
    print(f"Village buffers saved to {output_path}")
    return gdf


def villages_intersecting_zones(villages_path, zones_path, output_csv):
    villages = gpd.read_file(villages_path)
    zones = gpd.read_file(zones_path)
    joined = gpd.sjoin(villages, zones, how="inner", predicate="intersects")
    joined.drop(columns="geometry").to_csv(output_csv, index=False)
    print(f"Villages in red zones saved to {output_csv} ({len(joined)} matches)")
    return joined