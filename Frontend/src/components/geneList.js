import React, { useState, useEffect } from "react";
import { List, Card, Input, Tooltip, Empty, Typography } from "antd";
import { QuestionCircleOutlined, CloseOutlined } from '@ant-design/icons';
import "./Styles/geneList.css";

export const GeneList = ({ selectedGene, setSelectedGene, setRelatedGeneData, setShowtSNECluster, featureAnalysisType }) => {
    const [geneListData, setGeneListData] = useState([]);

    const fetchData = async (query) => {
        const response = await fetch(`/geneListSearch?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setGeneListData(data);
    };

    const searchGene = (value) => {
        if (value.trim() === "") {
            setGeneListData([]);
        } else {
            fetchData(value);
        }
    }

    const onFieldClear = () => {
        setSelectedGene(null);
        setRelatedGeneData(null);
        setGeneListData([]);
    };

    const fetchGeneData = (gene, type) => {
        fetch("/geneExpression", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gene: gene, method: type })
        })
            .then(response => response.json())
            .then(data => {
                setRelatedGeneData(data);
            });
    }

    const handleItemClick = (item) => {
        if (selectedGene === item) {
            setSelectedGene(null);
            setRelatedGeneData(null);
        } else {
            setShowtSNECluster(false);
            setSelectedGene(item);
            fetchGeneData(item, featureAnalysisType);
        }
    };

    useEffect(() => {
        if (selectedGene) {
            fetchGeneData(selectedGene, featureAnalysisType);
        }
    }, [featureAnalysisType]);
    return (
        <Card
            size="small"
            extra={<div style={{ marginBottom: 8 }}>
                <div className="geneListTitle">
                    Gene List
                    <Tooltip placement="right" title={"Choosing a gene from the gene list first to show the violin plot and expression on the tissue"} overlayInnerStyle={{ color: '#000' }} color={"white"}>
                        <QuestionCircleOutlined style={{ marginLeft: 3, fontSize: 10 }} />
                    </Tooltip>
                </div>
                <Input size="small" placeholder="Search Genes" onChange={e => searchGene(e.target.value)} allowClear={{ clearIcon: <CloseOutlined onClick={onFieldClear} /> }} />
            </div>}
            style={{ marginTop: 5, height: 'calc(100% - 350px)' }}
        >
            {geneListData.length !== 0 ? (
                <div id="scrollableCard" style={{ height: "95%", overflow: "auto" }}>
                    <List
                        size="small"
                        dataSource={geneListData}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    transition: "background-color 0.3s ease",
                                    backgroundColor: item === selectedGene ? '#6CB4EE' : 'transparent',
                                    color: item === selectedGene ? '#fff' : '#000',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#6CB4EE"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = item === selectedGene ? '#6CB4EE' : 'transparent'; e.currentTarget.style.color = item === selectedGene ? '#fff' : '#000'; }}
                                onClick={() => handleItemClick(item)}
                            >
                                {item}
                            </List.Item>
                        )}
                    />
                </div>) : (
                <Empty
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    imageStyle={{
                        height: 60,
                    }}
                    description={
                        <Typography.Text>
                            Searching a gene first.
                        </Typography.Text>
                    }
                />)}
        </Card >
    );
};
