import cdsapi
import os
from datetime import date

def fetch_glofas_historical(bbox, out_path, date):
    if os.path.exists(out_path):
        print(f"GloFAS historical data already exists at {out_path}, skipping fetch.")
        return out_path

    minx, miny, maxx, maxy = bbox
    area = [maxy, minx, miny, maxx]
    year, month, day = date.split("-")

    dataset = "cems-glofas-historical"
    request = {
        "system_version": ["version_4_0"],
        "hydrological_model": ["lisflood"],
        "product_type": ["consolidated"],
        "timespan": ["time_mean"],
        "variable": ["average_river_discharge_in_the_last_24_hours"],
        "year": [year],
        "month": [month],
        "day": [day],
        "data_format": "netcdf",
        "download_format": "unarchived",
        "area": area,
    }

    c = cdsapi.Client()
    c.retrieve(dataset, request).download(out_path)
    print(f"GloFAS historical ({date}) saved to {out_path}")
    return out_path

def fetch_glofas_forecast(bbox, out_path, leadtime_hour=24):
    """
    Fetch most-recent GloFAS operational control forecast river discharge.
    """
    if os.path.exists(out_path):
        print(f"GloFAS forecast already exists at {out_path}, skipping fetch.")
        return out_path

    minx, miny, maxx, maxy = bbox
    area = [maxy, minx, miny, maxx]

    today = date.today()
    dataset = "cems-glofas-forecast"
    request = {
        "system_version": ["operational"],
        "hydrological_model": ["lisflood"],
        "product_type": ["control_forecast"],
        "variable": "river_discharge_in_the_last_24_hours",
        "year": [f"{today.year}"],
        "month": [f"{today.month:02d}"],
        "day": [f"{today.day:02d}"],
        "leadtime_hour": [str(leadtime_hour)],
        "data_format": "netcdf",
        "download_format": "unarchived",
        "area": area,
    }

    c = cdsapi.Client()
    c.retrieve(dataset, request).download(out_path)
    print(f"GloFAS live forecast saved to {out_path}")
    return out_path