import os

# Base project directory (change if needed)
BASE_DIR = os.getcwd()

folders = [
    "DataSet",
    "scripts",
    "GIS model",
]

dataset_files = [
    "dem_raw.tif",
    "dem_utm.tif",
    "slope.tif",
    "slope_classified.tif",
    "red_zones.gpkg",
    "villages_raw.geojson",
    "villages_utm.gpkg",
    "village_buffers_final.gpkg",
    "ml_ready_villages.csv",
]

script_files = [
    "config.py",
    "raster_utils.py",
    "vector_utils.py",
    "zonal_stats.py",
    "river_data.py",
    "capacity.py",
    "main.py",
]

gis_model_files = [
    "GIS_data.qgz",
]

root_files = [
    "requirements.txt",
]


def create_folders():
    for folder in folders:
        path = os.path.join(BASE_DIR, folder)
        os.makedirs(path, exist_ok=True)
        print(f"Created folder: {path}")


def create_files(folder_name, filenames):
    folder_path = os.path.join(BASE_DIR, folder_name)
    for filename in filenames:
        file_path = os.path.join(folder_path, filename)
        if not os.path.exists(file_path):
            open(file_path, "w").close()
            print(f"Created file: {file_path}")
        else:
            print(f"Skipped (already exists): {file_path}")


def create_root_files(filenames):
    for filename in filenames:
        file_path = os.path.join(BASE_DIR, filename)
        if not os.path.exists(file_path):
            open(file_path, "w").close()
            print(f"Created file: {file_path}")
        else:
            print(f"Skipped (already exists): {file_path}")


if __name__ == "__main__":
    create_folders()
    create_files("DataSet", dataset_files)
    create_files("scripts", script_files)
    create_files("GIS model", gis_model_files)
    create_root_files(root_files)
    print("\nProject structure created successfully.")