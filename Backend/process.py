import pandas as pd
from scipy.io import mmread
from scipy import sparse
import numpy as np
import scanpy as sc
from scipy.optimize import fsolve
import h5py

# Load data
"""
geneList: list of genes
    ---attributes: 'gene', 'feature_type'

positions: list of Visium spot positions
    ---attributes: 'barcode', 'x', 'y', 'radius'

adata: whole gene expression data(hdf5 file)

tSNE_df: t-SNE projection positions
    ---attributes: 'Barcode', 'X Coordinate', 'Y Coordinate'

tSNE_cluster_df: based on t-SNE projection, each cell's cluster
    ---attributes: 'Barcode', 'Graph-based'

umi_counts: converted 'adata' to pandas dataframe
    ---attributes: rows are barcode, columns are gene name

cellTotal_df: each cell's total UMI counts
    ---attributes: 'barcode', 'total_counts'

up_regulated_L2FC_genes_df: list of up-regulated genes after L2FC analysis
    ---attributes: 'FeatureID', 'FeatureName', 'Cluster 1 Average', 'Cluster 1 Log2 Fold Change', 'Cluster 1 P-Value' ... 'Cluster 9 P-Value'

cellRadius_df: cell types radius
    ---attributes: 'barcode', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9'
"""

geneList = pd.read_csv("../Data/Genes.csv")
positions = pd.read_csv("../Data/SpotPositions.csv")
cellRadius_df = pd.read_csv("../Data/SpotClusterMembership.csv")
adata = sc.read_10x_h5("../Data/Filtered_feature_bc_matrix.h5")
tSNE_df = pd.read_csv("../Data/t-SNE_Projection.csv")
tSNE_cluster_df = pd.read_csv("../Data/t-SNE_Graph_Based.csv")
up_regulated_L2FC_genes_df = pd.read_csv("../Data/up_regulated_L2FC_genes.csv")

# rename columns
tSNE_df.rename(
    columns={"X Coordinate": "x", "Y Coordinate": "y", "Barcode": "barcode"},
    inplace=True,
)
tSNE_cluster_df.rename(
    columns={"Barcode": "barcode", "Graph-based": "cluster"}, inplace=True
)
up_regulated_L2FC_genes_df.rename(
    columns={
        "Cluster 1 Average": "cluster1Avg",
        "Cluster 1 Log2 Fold Change": "cluster1L2FC",
        "Cluster 1 P-Value": "cluster1PValue",
        "Cluster 2 Average": "cluster2Avg",
        "Cluster 2 Log2 Fold Change": "cluster2L2FC",
        "Cluster 2 P-Value": "cluster2PValue",
        "Cluster 3 Average": "cluster3Avg",
        "Cluster 3 Log2 Fold Change": "cluster3L2FC",
        "Cluster 3 P-Value": "cluster3PValue",
        "Cluster 4 Average": "cluster4Avg",
        "Cluster 4 Log2 Fold Change": "cluster4L2FC",
        "Cluster 4 P-Value": "cluster4PValue",
        "Cluster 5 Average": "cluster5Avg",
        "Cluster 5 Log2 Fold Change": "cluster5L2FC",
        "Cluster 5 P-Value": "cluster5PValue",
        "Cluster 6 Average": "cluster6Avg",
        "Cluster 6 Log2 Fold Change": "cluster6L2FC",
        "Cluster 6 P-Value": "cluster6PValue",
        "Cluster 7 Average": "cluster7Avg",
        "Cluster 7 Log2 Fold Change": "cluster7L2FC",
        "Cluster 7 P-Value": "cluster7PValue",
        "Cluster 8 Average": "cluster8Avg",
        "Cluster 8 Log2 Fold Change": "cluster8L2FC",
        "Cluster 8 P-Value": "cluster8PValue",
        "Cluster 9 Average": "cluster9Avg",
        "Cluster 9 Log2 Fold Change": "cluster9L2FC",
        "Cluster 9 P-Value": "cluster9PValue",
    },
    inplace=True,
)

# Convert feature matrix to dataframe
adata.var_names_make_unique()
umi_counts = adata.to_df()
total_counts = umi_counts.sum(axis=1)

# for geting normalized UMI counts
umi_df = umi_counts.copy()
umi_df.reset_index(inplace=True)
umi_df.rename(columns={'index': 'barcode'}, inplace=True)
# for linear feature violin plot
umi_linear_df = umi_df.copy()

# get total UMI counts for each cell
cellTotal_df = pd.DataFrame(
    {"barcode": total_counts.index, "total_counts": total_counts.values}
)
total_counts_dict = total_counts.to_dict()

cell_tsne_df = pd.merge(cellTotal_df, tSNE_df, on="barcode")
umi_with_total_counts_df = pd.merge(umi_df, cellTotal_df, on="barcode")
cell_cluster_UMI_tsne_df = pd.merge(cell_tsne_df, tSNE_cluster_df, on="barcode")
position_cell_ratios_df = pd.merge(positions, cellRadius_df, on="barcode")

# log2 transformation
umi_df.loc[:, umi_df.columns != 'barcode'] = np.log2(umi_df.loc[:, umi_df.columns != 'barcode'] + 1)

# log Normalization transformation
umi_with_total_counts_df.loc[:, umi_with_total_counts_df.columns != 'barcode'] = umi_with_total_counts_df.loc[:, umi_with_total_counts_df.columns != 'barcode'].div(umi_with_total_counts_df['total_counts'], axis=0) * 10000
umi_with_total_counts_df.loc[:, umi_with_total_counts_df.columns != 'barcode'] = np.log1p(umi_with_total_counts_df.loc[:, umi_with_total_counts_df.columns != 'barcode'])

violin_log2_df = pd.merge(tSNE_cluster_df, umi_df, on="barcode")
violin_logNorm_df = pd.merge(tSNE_cluster_df, umi_with_total_counts_df, on="barcode")
violin_linear_df = pd.merge(tSNE_cluster_df, umi_linear_df, on="barcode")

def get_gene_list():
    return list(geneList["gene"])


def get_gene_expression(gene, method):
    if method == 'linear': 
        return umi_counts[gene]
    elif method == 'log2':
        return violin_log2_df.set_index('barcode')[gene]
    else:
        return violin_logNorm_df.set_index('barcode')[gene]

# base on selected cell type to filter and cumsum each barcode's cell type ratios
def filter_and_cumsum(merged_df, selected_columns):
    def conditional_cumsum(row, selected_columns):
        cumsum = 0
        for col in selected_columns:
            if row[col] != 0:
                cumsum += row[col]
                row[col] = cumsum
        return row
    filtered_df = merged_df[['barcode', 'x', 'y', 'radius'] + selected_columns].copy()
    filtered_df[selected_columns] = filtered_df[selected_columns].apply(conditional_cumsum, axis=1, selected_columns=selected_columns)
    
    return filtered_df

def get_kosara_data(selected_columns):
    # Default circle settings
    hirescalef = 0.046594715
    spotDiameter = 142.38582253945773
    radius = spotDiameter * hirescalef / 2
    d = np.sqrt(2) * radius

    special_r, special_d = np.sqrt(2) * radius, np.sqrt(2) * radius
    special_angle1 = np.degrees(np.arccos((special_r**2 + d**2 - radius**2) / (2 * special_r * d)))
    special_angle2 = np.degrees(np.arccos((radius**2 + d**2 - special_r**2) / (2 * radius * d)))
    special_result = special_angle1 * special_r**2 + special_angle2 * radius**2 - d * special_r * np.sin(special_angle1)
    special_value = special_result / (np.pi * radius**2)

    # Calculate the occupied arc radius
    def equation(r, d, a, radius, special_value):
        angle1 = np.arccos((r**2 + d**2 - radius**2) / (2 * r * d))
        angle2 = np.arccos((radius**2 + d**2 - r**2) / (2 * radius * d))
        if (a <= special_value) :
            result = angle1 * r**2 + angle2 * radius**2 - d * r * np.sin(angle1)
        else:
            result = angle1 * r**2 + angle2 * radius**2 - r**2 * np.sin(angle1) * np.cos(angle1) - radius**2 * np.sin(angle2) * np.cos(angle2)
        return result - (a * np.pi * radius**2)
    
    def initial_guess(a, d, special_value):
        if a <= special_value:
            return d + 0.01
        elif a > 0.95:
            return 8
        else:    
            return a * 10 - 1.5

    def calculate_radius(df, originaldf):
        result_df = originaldf[['barcode', 'x', 'y', 'radius'] + selected_columns].copy()
        for index, row in df.iterrows():
            for col in selected_columns:
                a_value = row[col]
                if a_value == 0:
                    cal_radius = 0
                    angle = 0
                else:
                    try:
                        guess = initial_guess(a_value, d, special_value)
                        cal_radius = fsolve(equation, guess, args=(d, a_value, radius, special_value))[0]
                        angle = np.degrees(np.arccos((cal_radius**2 + d**2 - radius**2) / (2 * cal_radius * d)))
                    except ValueError as e:
                        cal_radius = np.nan
                        angle = np.nan
                result_df.loc[index, f"{col}_radius"] = cal_radius
                result_df.loc[index, f"{col}_angle"] = angle
        
        return result_df
    
    kosara_df = calculate_radius(filter_and_cumsum(position_cell_ratios_df, selected_columns), position_cell_ratios_df)
    
    return kosara_df

def get_UMI_totalCounts():
    return total_counts_dict


def get_tSNE_data():
    return cell_cluster_UMI_tsne_df


def get_cell_cluster_UMI_tsne_df():
    return tSNE_cluster_df


def get_up_regulated_L2FC_genes():
    return up_regulated_L2FC_genes_df


def get_log2_violin_plot_data():
    return violin_log2_df


def get_logNorm_violin_plot_data():
    return violin_logNorm_df


def get_linear_violin_plot_data():
    return violin_linear_df