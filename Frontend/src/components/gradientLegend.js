import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export const GradientLegend = ({ min, max, selectedGene, colorScaleType, showKosaraCharts }) => {
    const ref = useRef();
    const gradientId = useRef(`gradient-${Math.random().toString(36).slice(2, 11)}`);

    useEffect(() => {
        const svgElement = ref.current;
        const svg = d3.select(svgElement);
        const boundingRect = svgElement.getBoundingClientRect();
        const width = boundingRect.width;
        const height = 20;

        svg.selectAll("*").remove();

        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", gradientId.current)
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        if (colorScaleType === "Grey") {
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#808080");

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#808080");
        }

        if (colorScaleType === "Orange") {
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.interpolateOranges(0));
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d3.interpolateOranges(1));
        }

        if (colorScaleType === "Blue") {
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.interpolateBlues(0));
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d3.interpolateBlues(1));
        }

        if (colorScaleType === "double") {
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.interpolateRdYlBu(0));
            gradient.append("stop")
                .attr("offset", "50%")
                .attr("stop-color", d3.interpolateRdYlBu(0.5));
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d3.interpolateRdYlBu(1));
        }

        // Add rectangle filled with gradient
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", `url(#${gradientId.current})`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 15)
            .text(selectedGene ? selectedGene : "")
            .attr("font-size", "12px")
            .style("text-anchor", "middle");

        if (colorScaleType !== "Grey") {
            // Add text labels for min and max
            svg.append("text")
                .attr("x", 0)
                .attr("y", height + 15)
                .text((!showKosaraCharts && min || min === 0) ? (Number.isInteger(min) ? min : min.toFixed(3)) : "")
                .attr("font-size", "12px")
                .style("text-anchor", "start");

            svg.append("text")
                .attr("x", width)
                .attr("y", height + 15)
                .text((!showKosaraCharts && max || max === 0) ? (Number.isInteger(max) ? max : max.toFixed(3)) : "")
                .attr("font-size", "12px")
                .style("text-anchor", "end");
        }

    }, [min, max, selectedGene, colorScaleType, showKosaraCharts]);

    return (
        (colorScaleType === "double") ?
            <svg ref={ref} style={{ width: "100%", height: "35px" }} />
            :
            <svg ref={ref} style={{ width: "100%", height: "50px" }} />
    )
};