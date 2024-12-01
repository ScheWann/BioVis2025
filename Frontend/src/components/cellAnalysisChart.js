import React, { useEffect, useRef, useState } from "react";
import { Card, Button, Switch, Checkbox } from "antd";
import * as d3 from "d3";
import { GradientLegend } from "./gradientLegend"
import { ClusterLegend } from "./clusterLegend"
import "./Styles/cellAnalysisChart.css";

const clusterColors = d3.scaleOrdinal(d3.schemeCategory10);

export const CellAnalysisChart = ({ selectedData, setHoveronTSNECell, showKosaraCharts, setShowKosaraCharts, showtSNECluster, setShowtSNECluster, interestedCellType, setInterestedCellType, colorScheme }) => {
    const svgRef = useRef(null);
    const zoomRef = useRef();
    const tooltip = useRef(null);
    const [tabKey, setTabKey] = useState("cellTypeTab");
    const [tSNEData, setTSNEData] = useState([]);
    const [tSNEExpressionScale, settSNEExpressionScale] = useState([]);

    const labels = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9'];
    const tabList = [
        {
            key: "cellTypeTab",
            tab: "Cell Type Counts"
        },
        {
            key: "tSNETab",
            tab: "t-SNE Plot"
        }
    ]
    if (!tooltip.current) {
        tooltip.current = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }

    const resetZoom = () => {
        const svgElement = d3.select(svgRef.current);
        svgElement.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    };

    useEffect(() => {
        fetch("/getTSNEData")
            .then(res => res.json())
            .then(data => {
                const barcodes = Object.keys(data.barcode);
                const transformedData = barcodes.map(index => ({
                    barcode: data.barcode[index],
                    total_counts: data.total_counts[index],
                    coordinates: {
                        x: data.x[index],
                        y: data.y[index]
                    },
                    cluster: data.cluster[index]
                }))
                const totalCounts = transformedData.map(d => d.total_counts);
                const maxValue = Math.max(...Object.values(totalCounts));
                const minValue = Math.min(...Object.values(totalCounts));
                settSNEExpressionScale([minValue, maxValue]);
                setTSNEData(transformedData);
            });
    }, []);

    const chartList = {
        "cellTypeTab": <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>,
        "tSNETab":
            <div className="t-SNEDiv">
                <div className="controlGroup">
                    <Button size="small" onClick={resetZoom}>Reset Zoom</Button>
                    <Switch style={{ marginLeft: 20, backgroundColor: showtSNECluster ? '#ED9121' : '#6785A7' }} onChange={() => setShowtSNECluster(!showtSNECluster)} checkedChildren="Show t-SNE by UMI Counts" unCheckedChildren="Show t-SNE by Clustering" checked={showtSNECluster} />
                </div>
                {showtSNECluster ? <ClusterLegend scale={clusterColors} /> : <GradientLegend min={tSNEExpressionScale[0]} max={tSNEExpressionScale[tSNEExpressionScale.length - 1]} colorScaleType="Orange" />}
                <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
            </div>
    }

    const onChangeTabKey = (newTabKey) => {
        setTabKey(newTabKey);
        if (newTabKey === "tSNETab") {
            setShowKosaraCharts(false);
        } else {
            setShowKosaraCharts(true);
        }
    };

    // Cell Type Counts(bar chart)
    useEffect(() => {
        if (!selectedData || selectedData.length === 0 || !svgRef.current) return;
        if (!showKosaraCharts) {
            setTabKey("tSNETab");
        } else {
            setTabKey("cellTypeTab");
        }

        if (tabKey === "cellTypeTab") {
            const counts = labels.map(label =>
                selectedData.reduce((count, item) => count + (item.ratios[label] > 0 ? 1 : 0), 0)
            );
            const svgElement = d3.select(svgRef.current);
            svgElement.selectAll("*").remove();

            const width = svgRef.current.clientWidth;
            const height = svgRef.current.clientHeight;
            const margin = { top: 5, right: 25, bottom: 40, left: 50 };

            svgElement.attr("viewBox", `0 0 ${width} ${height}`);

            const xScale = d3.scaleBand()
                .domain(labels)
                .range([margin.left, width - margin.right])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(counts)])
                .range([height - margin.bottom, margin.top]);

            svgElement.selectAll(".bar")
                .data(counts)
                .enter()
                .append("rect")
                .classed("bar", true)
                .attr("id", (d, i) => labels[i])
                .attr("x", (d, i) => xScale(labels[i]))
                .attr("y", d => yScale(d))
                .attr("width", xScale.bandwidth())
                .attr("height", d => height - margin.bottom - yScale(d))
                .attr("fill", (d, i) => colorScheme[labels[i]])
                .on("mouseover", (event, d) => {
                    tooltip.current.html(`Count: ${d}`)
                        .style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 28}px`);
                    tooltip.current.style("opacity", .9);
                })
                .on("mouseout", () => {
                    tooltip.current.style("opacity", 0);
                })
                .on("click", (event, d) => {
                    const barId = event.target.id;
                    if (interestedCellType === barId) {
                        setInterestedCellType(null);
                    } else {
                        setInterestedCellType(barId);
                    }
                    event.stopPropagation();
                });

            svgElement.append("g")
                .attr("transform", `translate(0, ${height - margin.bottom})`)
                .call(d3.axisBottom(xScale));

            svgElement.append("g")
                .attr("transform", `translate(${margin.left}, 0)`)
                .call(d3.axisLeft(yScale));

            // x-axis label
            svgElement.append("text")
                .attr("x", width / 2)
                .attr("y", height - margin.bottom / 5)
                .attr("text-anchor", "middle")
                .attr("font-weight", "bold")
                .attr("font-size", "0.8em")
                .text("Cell Types");

            // y-axis label
            svgElement.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", margin.left / 5)
                .attr("font-weight", "bold")
                .attr("font-size", "0.8em")
                .attr("text-anchor", "middle")
                .text("Counts");

            const handleDocumentClick = () => {
                if (interestedCellType) {

                    setInterestedCellType(null);
                }
            };

            document.addEventListener("click", handleDocumentClick);

            return () => {
                document.removeEventListener("click", handleDocumentClick);
            };
        }
    }, [selectedData, tabKey]);

    useEffect(() => {
        const svgElement = d3.select(svgRef.current);
        if (interestedCellType) {
            svgElement.selectAll(".bar")
                .attr("fill", "lightgrey");
            svgElement.select(`#${interestedCellType}`)
                .attr("fill", colorScheme[interestedCellType]);
        } else {
            svgElement.selectAll(".bar")
                .attr("fill", (d, i) => colorScheme[labels[i]]);
        }
    }, [interestedCellType, colorScheme, labels]);

    // t-SNE plot
    useEffect(() => {
        if (tabKey !== "tSNETab" || !tSNEData.length || !svgRef.current) return;
        let clusters = tSNEData.map(d => d.cluster).filter((v, i, a) => a.indexOf(v) === i)
        const sortedClusters = clusters.sort((a, b) => {
            const numA = parseInt(a.split(' ')[1]);
            const numB = parseInt(b.split(' ')[1]);
            return numA - numB;
        });

        clusterColors.domain(sortedClusters);
        const svgElement = d3.select(svgRef.current);
        svgElement.selectAll("*").remove();

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        const margin = { top: 5, right: 25, bottom: 35, left: 40 };

        svgElement.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width - margin.left - margin.right)
            .attr("height", height - margin.top - margin.bottom)
            .attr("x", margin.left)
            .attr("y", margin.top);

        const xExtent = d3.extent(tSNEData, d => d.coordinates.x);
        const yExtent = d3.extent(tSNEData, d => d.coordinates.y);
        const xPadding = (xExtent[1] - xExtent[0]) * 0.05;
        const yPadding = (yExtent[1] - yExtent[0]) * 0.05;

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([margin.left, width - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
            .range([height - margin.bottom, margin.top]);
        // const colorScale = showtSNECluster ? clusterColors : d3.scaleSequentialLog(d3.interpolateBlues)
        const colorScale = showtSNECluster ? clusterColors : d3.scaleSequentialLog(d3.interpolateOranges)
            .domain(d3.extent(tSNEData, d => d.total_counts));

        const xAxis = d3.axisBottom(xScale).tickSize(-height + margin.top + margin.bottom)
            .tickPadding(10);
        const yAxis = d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right)
            .tickPadding(10);

        const zoom = d3.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", ({ transform }) => {
                svgElement.selectAll(".dot")
                    .attr('cx', d => transform.applyX(xScale(d.coordinates.x)))
                    .attr('cy', d => transform.applyY(yScale(d.coordinates.y)));
                svgElement.select(".x-axis").call(xAxis.scale(transform.rescaleX(xScale)));
                svgElement.select(".y-axis").call(yAxis.scale(transform.rescaleY(yScale)));
                svgElement.selectAll(".tick line").attr("stroke", "lightgrey");
            });

        svgElement.append("g")
            .classed("x-axis", true)
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis)
            .selectAll(".tick line").attr("stroke", "lightgrey");

        svgElement.append("g")
            .classed("y-axis", true)
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis)
            .selectAll(".tick line").attr("stroke", "lightgrey");

        const dotsGroup = svgElement.append("g")
            .attr("clip-path", "url(#clip)");

        dotsGroup.selectAll(".dot")
            .data(tSNEData)
            .enter()
            .append("circle")
            .classed("dot", true)
            .attr("cx", d => xScale(d.coordinates.x))
            .attr("cy", d => yScale(d.coordinates.y))
            .attr("r", 5)
            .attr("fill", d => showtSNECluster ? clusterColors(d.cluster) : colorScale(d.total_counts))
            .attr("stroke-width", 0.3)
            .attr("stroke", "black")
            .on("mouseover", (event, d) => {
                const info = `Barcode: ${d.barcode}<br/>${showtSNECluster ? 'Cluster: ' + d.cluster : 'UMI Counts: ' + d.total_counts}`;
                setHoveronTSNECell(d.barcode);
                tooltip.current.html(info)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                tooltip.current.style("opacity", .9);
            })
            .on("mouseout", d => {
                setHoveronTSNECell(null);
                tooltip.current.style("opacity", 0);
            });

        // x-axis label
        svgElement.append("text")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom / 3 + 8)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .attr("font-size", "0.8em")
            .text("t-SNE 1");

        // y-axis label
        svgElement.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", margin.left / 5)
            .attr("font-weight", "bold")
            .attr("font-size", "0.8em")
            .attr("text-anchor", "middle")
            .text("t-SNE 2");

        svgElement.call(zoom);
        zoomRef.current = zoom;

    }, [tSNEData, tabKey, showtSNECluster, setHoveronTSNECell, showKosaraCharts]);

    return (
        <Card
            size="small"
            tabList={tabList}
            activeTabKey={tabKey}
            onTabChange={onChangeTabKey}
            style={{ height: "45vh", width: "100%" }}
        >
            {chartList[tabKey]}
        </Card>
    );
};
