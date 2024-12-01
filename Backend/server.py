from flask import Flask, jsonify, request
from process import (get_gene_list, get_gene_expression, get_kosara_data, get_UMI_totalCounts, get_tSNE_data, get_cell_cluster_UMI_tsne_df, get_up_regulated_L2FC_genes, get_log2_violin_plot_data, get_logNorm_violin_plot_data, get_linear_violin_plot_data)
app = Flask(__name__)


@app.route('/geneListSearch')
def get_geneListSearch():
    query = request.args.get('q', '').lower()
    gene_list = get_gene_list()
    results = [item for item in gene_list if query in item.lower()]
    return jsonify(results)

@app.route('/geneExpression', methods=['POST'])
def get_geneExpression():
    gene = request.json['gene']
    method = request.json['method']
    return jsonify(get_gene_expression(gene, method).to_dict())

@app.route('/getKosaraData', methods=['POST'])
def get_kosaraData():
    cellTypes = request.json['cellTypes']
    return jsonify(get_kosara_data(cellTypes).to_dict())

@app.route('/getUMITotalCounts')
def get_UMITotalCounts():
    return jsonify(get_UMI_totalCounts())

@app.route('/getCellClusterUMItsne')
def get_cellClusterUMItsne():
    return jsonify(get_cell_cluster_UMI_tsne_df().to_dict("records"))

@app.route('/getTSNEData')
def get_tSNEData():
    return jsonify(get_tSNE_data().to_dict())

@app.route('/getUpRegulatedL2FCGenesbyPage')
def get_upRegulatedL2FCGenes():
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=15, type=int)
    data = get_up_regulated_L2FC_genes().to_dict("records")

    # Calculate start and end indexes
    start = (page - 1) * per_page
    end = start + per_page
    total = len(data)
    
    # Slice the data based on pagination
    paginated_data = data[start:end]

    return jsonify({
        'items': paginated_data,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@app.route('/getUpRegulatedL2FCGenes')
def get_upRegulatedL2FCGenesWithoutPages():
    return jsonify(get_up_regulated_L2FC_genes().to_dict("records"))

@app.route('/getLog2ViolinPlotData', methods=['POST'])
def get_log2violin_plot_data():
    gene_name = request.json['gene']
    df = get_log2_violin_plot_data()
    violin_data = df[['barcode', 'cluster', gene_name]]
    violin_data.columns = ['barcode', 'cluster', 'value']

    values = [{'name': row['cluster'], 'value': row['value']} for index, row in violin_data.iterrows()]

    response_data = {
        "values": values
    }

    return jsonify(response_data)

@app.route('/getLogNormViolinPlotData', methods=['POST'])
def get_logNormviolin_plot_data():
    gene_name = request.json['gene']
    df = get_logNorm_violin_plot_data()
    violin_data = df[['barcode', 'cluster', gene_name]]
    violin_data.columns = ['barcode', 'cluster', 'value']

    values = [{'name': row['cluster'], 'value': row['value']} for index, row in violin_data.iterrows()]

    response_data = {
        "values": values
    }

    return jsonify(response_data)

@app.route('/getLinearViolinPlotData', methods=['POST'])
def get_linearviolin_plot_data():
    gene_name = request.json['gene']
    df = get_linear_violin_plot_data()
    violin_data = df[['barcode', 'cluster', gene_name]]
    violin_data.columns = ['barcode', 'cluster', 'value']

    values = [{'name': row['cluster'], 'value': row['value']} for index, row in violin_data.iterrows()]

    response_data = {
        "values": values
    }

    return jsonify(response_data)


if __name__ == '__main__':
    app.run(debug=True)
