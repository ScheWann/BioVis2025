import React, { useEffect, useRef, useState } from "react";
import { Button } from "antd";
import { SelectOutlined, RedoOutlined, FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import * as d3 from "d3";
import scaleJson from "../data/scalefactors_json.json";
import hiresTissuePic from '../data/tissue_hires_image.png';
import './Styles/kosaraChart.css';

const clusters = ["Cluster 1", "Cluster 2", "Cluster 3", "Cluster 4", "Cluster 5", "Cluster 6", "Cluster 7", "Cluster 8", "Cluster 9"];

export const KosaraChart = ({ kosaraData, setKosaraData, setSelectedData, showBackgroundImage, showKosaraCharts, cellShownStatus, opacity, relatedGeneData, setGeneExpressionScale, selectedGene, UMITotalCounts, hoveronTSNECell, showtSNECluster, tissueClusterData, interestedCellType, colorScheme }) => {
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    const [brushActive, setBrushActive] = useState(false);
    const [centralized, setCentralized] = useState(false);

    const hirescalef = 0.046594715;
    const spotDiameter = scaleJson["spot_diameter_fullres"];
    const radius = spotDiameter * hirescalef / 2;
    const DEBOUNCE_DELAY = 1500;

    const unCheckedCellTypes = (obj) => {
        let falseCount = 0;
        for (const key in obj) {
            if (obj[key] === false) {
                falseCount++;
            }
        }
        return falseCount;
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            if (brushActive) {
                d3.select(svgRef.current).transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                );
            } else {
                d3.select(svgRef.current).attr("transform", event.transform);
            }
        });

    const resetZoom = () => {
        const svgElement = d3.select(svgRef.current);
        setCentralized(false);
        svgElement.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
        );
    };

    const generateKosaraPath = (pointX, pointY, angles, ratios, cal_radius, cellShownStatus) => {
        const sequenceOrder = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9'];
        let paths = [];
        let cellTypes = [];
        let startpointX, startpointY, endpointX, endpointY = 0;
        let lastStartPointX, lastStartPointY, lastEndPointX, lastEndPointY, lastCircleRadius = 0;
        let originalPointX = pointX - radius * Math.cos(45 * Math.PI / 180);
        let originalPointY = pointY + radius * Math.sin(45 * Math.PI / 180);

        // get selected cell types that are shown
        if (interestedCellType) {
            cellTypes.push(interestedCellType);
        } else {
            cellTypes = Object.entries(cellShownStatus).filter(([key, value]) => value).map(([key, value]) => key);
        }

        let cellIndices = ratios.filter(item => item[1] !== 0 && cellTypes.includes(item[0])).sort((a, b) => b[1] - a[1]).slice(0, 9).map(item => item[0]);
        let cellAngles = cellIndices.map(index => angles.find(item => item[0] === index));
        let cellRadius = cellIndices.map(index => cal_radius.find(item => item[0] === index));

        // If no selected cells are shown, draw an empty circle
        if (cellAngles.length === 0) {
            paths.push({ path: '', color: 'transparent' });
        } else {
            cellAngles = cellAngles.map(angle => [angle[0], angle[1]]);
            cellRadius = cellRadius.map(rad => [rad[0], rad[1]]);
            cellAngles.sort((a, b) => sequenceOrder.indexOf(a[0]) - sequenceOrder.indexOf(b[0]));
            cellRadius.sort((a, b) => sequenceOrder.indexOf(a[0]) - sequenceOrder.indexOf(b[0]));

            cellAngles.forEach((angle, index) => {
                let cal_cell_radius = cellRadius[index][1];

                startpointX = originalPointX + Math.abs(cal_cell_radius * Math.cos((angle[1] + 45) * Math.PI / 180));
                startpointY = originalPointY - Math.abs(cal_cell_radius * Math.sin((angle[1] + 45) * Math.PI / 180));
                endpointX = originalPointX + Math.abs(cal_cell_radius * Math.cos((angle[1] - 45) * Math.PI / 180));
                endpointY = originalPointY - Math.abs(cal_cell_radius * Math.sin((angle[1] - 45) * Math.PI / 180));

                let path = '';

                if (index === 0) {
                    if (cal_cell_radius > Math.sqrt(3) * radius) {
                        path = `M ${startpointX} ${startpointY} A ${cal_cell_radius} ${cal_cell_radius} 0 0 1 ${endpointX} ${endpointY} A ${radius} ${radius} 0 1 1 ${startpointX} ${startpointY} Z`;
                    } else {
                        path = `M ${startpointX} ${startpointY} A ${cal_cell_radius} ${cal_cell_radius} 0 0 1 ${endpointX} ${endpointY} A ${radius} ${radius} 0 0 1 ${startpointX} ${startpointY} Z`;
                    }
                }
                else if (index === cellAngles.length - 1) {
                    if (lastCircleRadius <= Math.sqrt(3) * radius) {
                        path = `M ${lastStartPointX} ${lastStartPointY} A ${lastCircleRadius} ${lastCircleRadius} 0 0 1 ${lastEndPointX} ${lastEndPointY} A ${radius} ${radius} 0 1 0 ${lastStartPointX} ${lastStartPointY} Z`;
                    } else {
                        path = `M ${lastStartPointX} ${lastStartPointY} A ${lastCircleRadius} ${lastCircleRadius} 0 0 1 ${lastEndPointX} ${lastEndPointY} A ${radius} ${radius} 0 0 0 ${lastStartPointX} ${lastStartPointY} Z`;
                    }
                }
                else {
                    path = `M ${lastStartPointX} ${lastStartPointY} A ${lastCircleRadius} ${lastCircleRadius} 0 0 1 ${lastEndPointX} ${lastEndPointY} A ${radius} ${radius} 0 0 0 ${endpointX} ${endpointY} A ${cal_cell_radius} ${cal_cell_radius} 0 0 0 ${startpointX} ${startpointY} A ${radius} ${radius} 0 0 0 ${lastStartPointX} ${lastStartPointY} Z`;
                }

                paths.push({ path, color: colorScheme[angle[0]] });

                lastCircleRadius = cal_cell_radius;
                lastStartPointX = startpointX;
                lastStartPointY = startpointY;
                lastEndPointX = endpointX;
                lastEndPointY = endpointY;
            });

            const lastAngle = cellAngles[cellAngles.length - 1][1];
            if (lastAngle < 90 && (unCheckedCellTypes(cellShownStatus) > 0 || interestedCellType)) {
                let path = '';
                if (lastCircleRadius <= Math.sqrt(3) * radius) {
                    path = `M ${lastStartPointX} ${lastStartPointY} A ${lastCircleRadius} ${lastCircleRadius} 0 0 1 ${lastEndPointX} ${lastEndPointY} A ${radius} ${radius} 0 1 0 ${lastStartPointX} ${lastStartPointY} Z`;
                } else {
                    path = `M ${lastStartPointX} ${lastStartPointY} A ${lastCircleRadius} ${lastCircleRadius} 0 0 1 ${lastEndPointX} ${lastEndPointY} A ${radius} ${radius} 0 0 0 ${lastStartPointX} ${lastStartPointY} Z`;
                }
                paths.push({ path, color: 'white' });
            }
        }
        return paths;
    }

    const handleKosaraMouseOver = (event, d) => {
        const tooltip = d3.select(tooltipRef.current);
        const sequenceOrder = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9'];
        let cellTypes;
        if (!interestedCellType) {
            cellTypes = d
                .filter(item => item[1] !== 0 && cellShownStatus[item[0]] === true)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 9);
        } else {
            cellTypes = d
                .filter(item => item[1] !== 0 && item[0] === interestedCellType)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 9);
        }

        cellTypes.sort((a, b) => sequenceOrder.indexOf(a[0]) - sequenceOrder.indexOf(b[0]));
        tooltip
            .style("display", "block")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .style("font-size", "12px")
            .style("font-family", "sans-serif")
            .style("z-index", "1000")
            .html(cellTypes.map(item => `${item[0]}: ${(item[1] * 100).toFixed(2)}%`).join("<br>"));
    }

    const handleGeneMouseOver = (event, d) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style("display", "block")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .style("font-size", "12px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("font-family", "sans-serif")
            .style("z-index", "1000")
            .html(`${d.selectedGene ? `Gene: ${d.selectedGene}<br>` : ''}Barcode: ${d.barcode}<br>${showtSNECluster ? `Cluster: ${d.cluster}` : `UMI Counts: ${d.relatedGeneValue}`}`);
    }

    const handleMouseOut = () => {
        d3.select(tooltipRef.current).style("display", "none");
    }

    const circleRender = (data, svgGroup) => {
        if (!showtSNECluster) {
            const minValue = Math.min(...Object.values(data));
            const maxValue = Math.max(...Object.values(data));

            setGeneExpressionScale([minValue, maxValue]);
            const colorScale = d3.scaleSequential(d3.interpolateOranges).domain([minValue, maxValue]);

            kosaraData.forEach((d) => {
                const relatedGeneValue = data[d.barcode];
                const color = relatedGeneValue ? colorScale(relatedGeneValue) : 'none';
                const group = svgGroup.append("g")
                    .attr("transform", `translate(${d.x}, ${d.y})`)
                    .attr("opacity", opacity)
                    .on("mouseover", (event) => handleGeneMouseOver(event, { selectedGene: selectedGene, barcode: d.barcode, relatedGeneValue: relatedGeneValue }))
                    .on("mouseout", handleMouseOut);

                group.append("circle")
                    .attr("r", radius)
                    .attr("fill", color)
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.1);
            });
        } else {
            const clusterColors = d3.scaleOrdinal()
                .domain(clusters)
                .range(d3.schemeCategory10);
            kosaraData.forEach((d) => {
                const dataItem = data.find(item => item.barcode === d.barcode);
                const cluster = dataItem ? dataItem.cluster : null;
                const color = cluster !== null ? clusterColors(cluster) : 'none';
                const group = svgGroup.append("g")
                    .attr("transform", `translate(${d.x}, ${d.y})`)
                    .attr("opacity", opacity)
                    .on("mouseover", (event) => handleGeneMouseOver(event, { barcode: d.barcode, cluster: cluster }))
                    .on("mouseout", handleMouseOut);

                group.append("circle")
                    .attr("r", radius)
                    .attr("fill", color)
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.1);
            });
        }
    }

    // loading data
    useEffect(() => {
        const selectedCellTypes = Object.keys(cellShownStatus).filter(key => cellShownStatus[key]);

        const fetchKosaraData = () => {
            fetch("/getKosaraData", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cellTypes: selectedCellTypes })
            })
                .then(response => response.json())
                .then(data => {
                    const indices = Object.keys(data.barcode);
                    const transformedData = indices.map(index => {
                        const ratios = {};
                        const angles = {};
                        const radius = {};

                        // Populate ratios, angles, and radius based on selectedCellTypes
                        selectedCellTypes.forEach(cellType => {
                            ratios[cellType] = +data[cellType][index];
                            angles[cellType] = +data[`${cellType}_angle`][index];
                            radius[cellType] = +data[`${cellType}_radius`][index];
                        });

                        return {
                            barcode: data.barcode[index],
                            x: +data.x[index] * hirescalef,
                            y: +data.y[index] * hirescalef,
                            ratios: ratios,
                            angles: angles,
                            radius: radius
                        };
                    });

                    setKosaraData(transformedData);
                });
        };

        const debounceTimeout = setTimeout(fetchKosaraData, DEBOUNCE_DELAY);

        return () => clearTimeout(debounceTimeout);
    }, [cellShownStatus]);


    // rendering background image
    useEffect(() => {
        const svgElement = d3.select(svgRef.current);
        const backgroundGroup = svgElement.select(".background").empty() ? svgElement.append("g").attr("class", "background") : svgElement.select(".background");

        if (showBackgroundImage) {
            backgroundGroup.selectAll("image").remove();
            backgroundGroup.append("image")
                .attr("href", hiresTissuePic)
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("preserveAspectRatio", "xMidYMid slice")
                .attr("class", "background-image");
        } else {
            backgroundGroup.select(".background-image").remove();
        }
    }, [showBackgroundImage]);

    useEffect(() => {
        const svgElement = d3.select(svgRef.current);

        const brushEnded = (event) => {
            const selection = event.selection;
            if (!selection) return;

            const [[x0, y0], [x1, y1]] = selection;

            const brushedData = kosaraData.filter(d => {
                if (!d) return;
                const scaledX = d.x
                const scaledY = d.y
                return scaledX >= x0 && scaledX <= x1 && scaledY >= y0 && scaledY <= y1;
            });
            const selectedData = brushedData.map(d => ({
                barcode: d.barcode,
                x: d.x,
                y: d.y,
                ratios: Object.fromEntries(Object.entries(d.ratios).filter(([key, value]) => selectedCells.includes(key))),
            }));
            setSelectedData(selectedData);
        }

        const brush = d3.brush()
            .extent([[0, 0], [800, 800]])
            .on("brush", brushEnded);

        const svg = svgElement
            .attr("viewBox", "0 0 800 800")
            .attr("preserveAspectRatio", "xMidYMid meet")

        // remove duplicate brush
        svg.select(".brush").remove();

        if (centralized && !brushActive) {
            svgElement.transition().duration(750)
                .call(zoom.transform, d3.zoomIdentity.translate(-0.8602070500021739, -12.787346962781953).scale(1.1859144994109523));
        }

        if (showKosaraCharts && brushActive) {
            svg.append("g")
                .attr("class", "brush")
                .call(brush)
            svg.on('.zoom', null);
        } else if (!brushActive) {
            svg.call(zoom);
        }

        const selectedCells = Object.keys(cellShownStatus).filter(cell => cellShownStatus[cell]);
        setSelectedData(kosaraData.map(d => ({
            barcode: d.barcode,
            x: d.x,
            y: d.y,
            ratios: Object.fromEntries(Object.entries(d.ratios).filter(([key, value]) => selectedCells.includes(key))),
        })));

        const contentGroup = svg.select(".content").empty() ? svg.append("g").attr("class", "content") : svg.select(".content");

        contentGroup.selectAll("g").remove();
        if (showKosaraCharts) {
            kosaraData.forEach((d) => {
                const angles = Object.entries(d.angles);
                const ratios = Object.entries(d.ratios);
                const radius = Object.entries(d.radius);
                const group = contentGroup.append("g")
                    .attr("class", "kosara-chart")
                    .attr("opacity", opacity)
                    .on("mouseover", (event) => handleKosaraMouseOver(event, ratios.filter(([key, value]) => value !== 0)))
                    .on("mouseout", handleMouseOut);

                const paths = generateKosaraPath(d.x, d.y, angles, ratios, radius, cellShownStatus);
                if (unCheckedCellTypes(cellShownStatus) > 0 || interestedCellType) {
                    group.append("circle")
                        .attr("transform", `translate(${d.x}, ${d.y})`)
                        .attr("r", radius)
                        .attr("fill", "none")
                        .attr("stroke", "black")
                        .on("mouseover", (event) => handleGeneMouseOver(event, { selectedGene: selectedGene, barcode: d.barcode }))
                        .on("mouseout", handleMouseOut)
                        .attr("stroke-width", 0.1);
                }

                paths.forEach(({ path, color }) => {
                    group.append('path')
                        .attr('d', path)
                        .attr('fill', color)
                        .on("mouseover", (event) => handleGeneMouseOver(event, { selectedGene: selectedGene, barcode: d.barcode }))
                        .on("mouseout", handleMouseOut);
                });

                if (d.barcode === hoveronTSNECell) {
                    group.select("circle").attr("stroke", "#333").attr("stroke-width", 2);
                }
            });
        } else {
            if (relatedGeneData && !showtSNECluster) {
                circleRender(relatedGeneData, contentGroup);
            }

            if (Object.keys(UMITotalCounts).length !== 0 && !showtSNECluster) {
                circleRender(UMITotalCounts, contentGroup);
            }

            if (showtSNECluster) {
                circleRender(tissueClusterData, contentGroup);
            }
        }
    }, [showKosaraCharts, opacity, kosaraData, cellShownStatus, relatedGeneData, UMITotalCounts, hoveronTSNECell, showtSNECluster, brushActive, centralized, interestedCellType, colorScheme]);

    return (
        <>
            <div style={{ display: "flex", overflow: "hidden", height: "99vh", position: "relative" }}>
                <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
                <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    padding: "10px",
                    zIndex: 1,
                }}>
                    {centralized ? <Button style={{ fontSize: 20, cursor: "pointer", marginRight: 20 }} icon={<FullscreenOutlined />} onClick={resetZoom} disabled={brushActive}></Button> : <Button style={{ fontSize: 20, cursor: "pointer", marginRight: 20 }} icon={<FullscreenExitOutlined />} onClick={() => setCentralized(!centralized)} disabled={brushActive}></Button>}
                    <Button style={{ fontSize: 20, cursor: "pointer", marginRight: 20 }} icon={<RedoOutlined />} onClick={resetZoom} disabled={brushActive}></Button>
                    <Button style={{ fontSize: 20, cursor: "pointer" }} icon={<SelectOutlined />} onClick={() => setBrushActive(!brushActive)} />
                </div>
            </div>
            <div ref={tooltipRef} className="kosaraTooltip"></div>
        </>
    );
};
