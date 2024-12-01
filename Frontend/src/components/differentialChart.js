import React, { useEffect, useRef, useState } from 'react';
import { Card } from "antd";
import { DifferentialFeatureTable } from './differentialFeatureTable';
import { DifferentialFeatureHeatmap } from './differentialFeatureHeatmap';
import { BoxplotViolinMirrorDemo } from './violinPlot/BoxplotViolinMirrorDemo.tsx'

export const DifferentialChart = ({ selectedGene, featureAnalysisType, setFeatureAnalysisType }) => {
    const [differentialChartTabKey, setDifferentialChartTabKey] = useState("tableTab");
    const [differentialChartData, setDifferentialChartData] = useState({
        items: [],
        page: 1,
        per_page: 15,
        total: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [cardHeight, setCardHeight] = useState(0);
    const onChangedifferentialChartTabKey = key => {
        setDifferentialChartTabKey(key);
    }

    const cardRef = useRef(null);

    useEffect(() => {
        fetchDifferentialData(currentPage, pageSize);
    }, [currentPage, pageSize]);

    useEffect(() => {
        if (cardRef.current) {
            setCardHeight(cardRef.current.clientHeight);
        }
    }, [differentialChartTabKey]);

    const fetchDifferentialData = (page, size) => {
        fetch(`/getUpRegulatedL2FCGenesbyPage?page=${page}&per_page=${size}`)
            .then(response => response.json())
            .then(data => {
                setDifferentialChartData(data);
            });
    };

    const differentialChartList = {
        "tableTab": <DifferentialFeatureTable differentialChartData={differentialChartData} currentPage={currentPage} pageSize={pageSize} setCurrentPage={setCurrentPage} setPageSize={setPageSize} cardHeight={cardHeight} />,
        "HeatmapTab": <DifferentialFeatureHeatmap differentialChartData={differentialChartData} />,
        "ViolinTab" : <BoxplotViolinMirrorDemo selectedGene={selectedGene} featureAnalysisType={featureAnalysisType} setFeatureAnalysisType={setFeatureAnalysisType} />
    }

    const tabList = [
        {
            key: "tableTab",
            tab: "Table"
        },
        {
            key: "HeatmapTab",
            tab: "Heatmap"
        },
        {
            key: "ViolinTab",
            tab: "Violin Plot"
        }
    ]

    return (
        <Card
            size="small"
            tabList={tabList}
            activeTabKey={differentialChartTabKey}
            onTabChange={onChangedifferentialChartTabKey}
            style={{ height: "54vh", width: "100%" }}
            ref={cardRef}
        >
            {differentialChartList[differentialChartTabKey]}
        </Card>
    );
};
