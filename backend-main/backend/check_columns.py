import pandas as pd 
print(pd.read_csv('combined_cleaned_dataset/combined_master.csv', nrows=0).columns.tolist())