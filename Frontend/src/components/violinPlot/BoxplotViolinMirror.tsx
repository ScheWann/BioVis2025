import React, { useMemo, useRef } from "react";
import * as d3 from "d3";
import { getSummaryStats } from "./summary-stats.ts";
import { AxisLeft } from "./AxisLeft.tsx";
import { AxisBottom } from "./AxisBottomCategoric.tsx";
import { VerticalBox } from "./VerticalBox.tsx";
import { VerticalViolinShape } from "./VerticalViolinShape.tsx";

const MARGIN = { top: 10, right: 0, bottom: 25, left: 40 };
const JITTER_WIDTH = 40;

type BoxplotViolinMirrorProps = {
  width: number;
  height: number;
  data: { name: string; value: number }[];
  mirrorPosition: number;
  smoothing: boolean;
};

export const BoxplotViolinMirror = ({
  width,
  height,
  data,
  mirrorPosition,
  smoothing,
}: BoxplotViolinMirrorProps) => {
  const tooltip = useRef<null | d3.selection<HTMLDivElement, unknown, HTMLElement, any>>(null);
  const boundsWidth = useMemo(() => {
    return width - MARGIN.right - MARGIN.left;
  }, [width]);
  const boundsHeight = useMemo(() => {
    return height - MARGIN.top - MARGIN.bottom;
  }, [height]);
  if (!tooltip.current) {
    tooltip.current = d3
      .select("body")
      .append("div")
      .attr("class", "violinPlotTooltip")
      .style("opacity", 0);
  }
  // Compute everything derived from the dataset:
  const { chartMin, chartMax, groups } = useMemo(() => {
    const [chartMin, chartMax] = d3.extent(data.map((d) => d.value)) as [
      number,
      number
    ];
    const clusterGroups = [...new Set(data.map((d) => d.name))];
    const groups = clusterGroups.sort((a, b) => {
      const numA = parseInt(a.split(' ')[1]);
      const numB = parseInt(b.split(' ')[1]);
      return numA - numB;
    });
    return { chartMin, chartMax, groups };
  }, [data]);

  //
  // Scales
  //
  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([chartMin, chartMax + (chartMax - chartMin) * 0.1])
      .range([boundsHeight, 0])
      .nice();
  }, [data, height]);

  const xScale = useMemo(() => {
    return d3.scaleBand().range([0, boundsWidth]).domain(groups).padding(0.15);
  }, [data, width]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

  //
  // Boxplot boxes (with jittering on top)
  //
  const allBoxes = useMemo(() => {
    return groups.map((group, i) => {
      const groupData = data
        .filter((d) => d.name === group)
        .map((d) => d.value);
      const sumStats = getSummaryStats(groupData);

      if (!sumStats) {
        return null;
      }

      const { min, q1, median, mean, q3, max } = sumStats;

      return (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            width: xScale.bandwidth(),
            height: boundsHeight,
            left: xScale(group),
          }}
        >
          <svg height={boundsHeight} width={xScale.bandwidth()}>
            <VerticalBox
              tooltip={tooltip}
              width={xScale.bandwidth()}
              q1={yScale(q1 || 0)}
              median={yScale(median || 0)}
              q3={yScale(q3 || 0)}
              min={yScale(min)}
              max={yScale(max)}
              data={groupData}
              stroke="black"
              fill={colorScale(group)}
            />
            {groupData.map((value, i) => (
              <circle
                key={i}
                cx={
                  xScale.bandwidth() / 2 -
                  JITTER_WIDTH / 2 +
                  Math.random() * JITTER_WIDTH
                }
                cy={yScale(value)}
                r={2}
                fill="grey"
                stroke="black"
                strokeOpacity={0.2}
                fillOpacity={0.3}
                onMouseMove={(event) => {
                  const info = `Value: ${value.toFixed(3)}`;
                  tooltip.current?.html(info)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .style("opacity", 0.9);
                }}
                onMouseOut={() => {
                  tooltip.current?.style("opacity", 0);
                }}
              />
            ))}
          </svg>
        </div>
      );
    });
  }, [data, xScale, yScale]);

  //
  // Violins (with variable width for mirror move)
  //
  const allViolins = groups.map((group, i) => {
    const groupData = data.filter((d) => d.name === group).map((d) => d.value);
    return (
      <div key={i}>
        <div
          style={{
            position: "absolute",
            top: 0,
            width: mirrorPosition * xScale.bandwidth(),
            height: boundsHeight,
            left: xScale(group),
            backgroundColor: "#f9f9fa",
            overflow: "hidden",
            borderRight: "solid #e5e5e5 2px",
          }}
        >
          <svg height={boundsHeight} width={xScale.bandwidth()}>
            <VerticalViolinShape
              tooltip={tooltip}
              data={groupData}
              binNumber={9}
              yScale={yScale}
              width={xScale.bandwidth()}
              fill={colorScale(group)}
              smoothing={smoothing}
            />
          </svg>
        </div>
      </div>
    );
  });

  return (
    <div style={{ position: "relative", width, height }}>
      <div style={{ width, height, position: "absolute", top: 0, left: 0 }}>
        <div
          style={{
            width: boundsWidth,
            height: boundsHeight,
            transform: `translate(${MARGIN.left}px, ${MARGIN.top}px)`,
          }}
        >
          {allBoxes}
          {allViolins}
        </div>
      </div>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        >
          <AxisLeft yScale={yScale} pixelsPerTick={30} />
          <g transform={`translate(0, ${boundsHeight})`}>
            <AxisBottom xScale={xScale} />
          </g>
        </g>
      </svg>
    </div>
  );
};
