import * as d3 from "d3";
import React, { useState, useRef } from "react";
import "../Styles/violinPlot.css";

type VerticalViolinShapeProps = {
  tooltip: React.MutableRefObject<any>;
  data: number[];
  binNumber: number;
  yScale: d3.scaleLinear<number, number, never>;
  width: number;
  fill: string;
  smoothing: boolean;
};

export const VerticalViolinShape = ({
  tooltip,
  data,
  yScale,
  width,
  binNumber,
  fill,
  smoothing,
}: VerticalViolinShapeProps) => {
  const min = Math.min(...data);
  const max = Math.max(...data);

  const thresholds = d3.range(min, max, (max - min) / binNumber);
  if (thresholds[thresholds.length - 1] !== max) {
    thresholds.push(max);
  }
  
  const binBuilder = d3
    .bin()
    .domain([min, max])
    .thresholds(thresholds)
    .value((d) => d);
  const bins = binBuilder(data);
  
  const biggestBin = Math.max(...bins.map((b) => b.length));

  const wScale = d3
    .scaleLinear()
    .domain([-biggestBin, biggestBin])
    .range([0, width]);

  const areaBuilder = d3
    .area<d3.bin<number, number>>()
    .x0((d) => wScale(-d.length))
    .x1((d) => wScale(d.length))
    .y((d) => {
      return yScale(d.x0 || 0);
    })
    .curve(smoothing ? d3.curveBumpY : d3.curveStep);

  const areaPath = areaBuilder(bins);
  return (
    <>
      <path
        d={areaPath ? areaPath : ""}
        opacity={1}
        stroke="black"
        fill={fill}
        fillOpacity={1}
        strokeWidth={1}
        onMouseMove={(event) => {
          const mean = d3.mean(data) ?? 0;
          const q1 = d3.quantile(data, 0.25) ?? 0;
          const q3 = d3.quantile(data, 0.75) ?? 0;
          const median = d3.median(data) ?? 0;
          const info = `Min: ${min}<br/>Max: ${max.toFixed(3)}<br/>Mean: ${mean.toFixed(3)}<br/>Median: ${median.toFixed(3)}<br/>Q1: ${q1.toFixed(3)}<br/>Q3: ${q3.toFixed(3)}<br/> `;
          tooltip.current?.html(info)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`)
            .style("opacity", 0.9);
        }}
        onMouseOut={() => {
          tooltip.current?.style("opacity", 0);
        }}
      />
    </>
  );
};
