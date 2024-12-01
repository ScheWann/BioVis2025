import React, { useState, useEffect } from 'react';
import { Table, Tooltip } from "antd";
import { QuestionCircleOutlined } from '@ant-design/icons';
import "./Styles/differentialFeatureTable.css";

export const DifferentialFeatureTable = ({ differentialChartData, currentPage, pageSize, setCurrentPage, setPageSize, cardHeight }) => {
    const columns = [
        {
            title: 'Gene',
            dataIndex: 'FeatureName',
            key: 'FeatureName',
            fixed: 'left',
            align: 'center',
            width: 60,
            sorter: (a, b) => a.FeatureName.localeCompare(b.FeatureName)
        },
        ...Array.from({ length: 9 }, (_, i) => ({
            title: `Cluster ${i + 1}`,
            children: [
                // {
                //     title: 'Avg',
                //     dataIndex: `cluster${i + 1}Avg`,
                //     key: `cluster${i + 1}Avg`,
                //     width: 100,
                //     align: 'center',
                //     render: (value) => `${Number(value).toExponential(2)}`
                // },
                {
                    title: (
                        <Tooltip placement="right" title="L2FC(Log2 fold change)is the ratio of the normalized mean gene UMI counts in the cluster relative to all other clusters, Features with L2FC < 0 were grayed out." overlayInnerStyle={{ color: '#000' }} color={"white"}>
                            <span>L2FC <QuestionCircleOutlined style={{ fontSize: 12 }} /></span>
                        </Tooltip>
                    ),
                    dataIndex: `cluster${i + 1}L2FC`,
                    key: `cluster${i + 1}L2FC`,
                    width: 80,
                    align: 'center',
                    // sorter: (a, b) => a[`cluster${i + 1}L2FC`] - b[`cluster${i + 1}L2FC`],
                    render: (value) => {
                        const style = value < 0 ? { color: '#999' } : {};
                        return <span style={style}>{Number(value).toFixed(3)}</span>;
                    }
                },
                {
                    title: (
                        <Tooltip placement="right" title="Genes with a smaller p-value are considered to be differentially expressed. P-values are adjusted using the Benjamini-Hochberg correction for multiple tests. Adjusted p-value >= 0.10 were grayed out, and p-value <=0.001 values were replaced by 'X'" overlayInnerStyle={{ color: '#000' }} color={"white"}>
                            <span>P-Value <QuestionCircleOutlined style={{ fontSize: 12 }} /></span>
                        </Tooltip>
                    ),
                    dataIndex: `cluster${i + 1}PValue`,
                    key: `cluster${i + 1}PValue`,
                    width: 80,
                    align: 'center',
                    // sorter: (a, b) => a[`cluster${i + 1}PValue`] - b[`cluster${i + 1}PValue`],
                    render: (value) => {
                        const style = value >= 0.1 ? { color: '#999' } : {};
                        return <span style={style}>{value <= 0.001 ? 'X' : Number(value).toFixed(3)}</span>;
                    }
                }
            ]
        }))
    ];

    const handleTableChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    return (
        <Table
            style={{ height: "100%", width: "100%", display: "inline-block" }}
            size="small"
            columns={columns}
            dataSource={differentialChartData.items.map((item, index) => ({ key: index, ...item }))}
            pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: differentialChartData.total,
                showSizeChanger: false,
                onChange: handleTableChange,
            }}
            scroll={{ x: 700, y: cardHeight - 135}}
        />
    );
};
