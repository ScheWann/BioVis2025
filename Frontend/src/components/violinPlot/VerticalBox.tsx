import React from "react";
import * as d3 from "d3";
const STROKE_WIDTH = 40;

// A reusable component that builds a vertical box shape using svg
// Note: numbers here are px, not the real values in the dataset.

type VerticalBoxProps = {
  tooltip: React.MutableRefObject<any>;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  width: number;
  stroke: string;
  fill: string;
  data: number[];
};

export const VerticalBox = ({
  tooltip,
  min,
  q1,
  median,
  q3,
  max,
  width,
  stroke,
  fill,
  data
}: VerticalBoxProps) => {
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const meanValue = d3.mean(data) ?? 0;
  const medianValue = d3.median(data) ?? 0;
  const q1Value = d3.quantile(data, 0.25) ?? 0;
  const q3Value = d3.quantile(data, 0.75) ?? 0;
  return (
    <>
      <line
        x1={width / 2}
        x2={width / 2}
        y1={min}
        y2={max}
        stroke={stroke}
        width={STROKE_WIDTH}
      />
      <rect
        x={0}
        y={q3}
        width={width}
        height={q1 - q3}
        stroke={stroke}
        fill={fill}
        onMouseMove={(event) => {
          const info = `Min: ${minValue}<br/>Max: ${maxValue.toFixed(3)}<br/>Mean: ${meanValue.toFixed(3)}<br/>Median: ${medianValue.toFixed(3)}<br/>Q1: ${q1Value.toFixed(3)}<br/>Q3: ${q3Value.toFixed(3)}<br/> `;
          tooltip.current?.html(info)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`)
            .style("opacity", 0.9);
        }}
        onMouseOut={() => {
          tooltip.current?.style("opacity", 0);
        }}
      />
      <line
        x1={0}
        x2={width}
        y1={median}
        y2={median}
        stroke={stroke}
        width={STROKE_WIDTH}
      />
    </>
  );
};
