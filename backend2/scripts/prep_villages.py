import geopandas as gpd 
gdf = gpd.read_file("../DataSet/villages_raw.geojson") 
print(f"Loaded {len(gdf)} village features") 
gdf_utm = gdf.to_crs("EPSG:32644") 
gdf_utm.to_file("../DataSet/villages_utm.gpkg", driver="GPKG") 
print("Saved villages_utm.gpkg successfully")