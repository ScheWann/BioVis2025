import React, { useEffect, useState, useRef } from "react";
import { Empty, Typography, Select } from "antd";
import { BoxplotViolinMirror } from "./BoxplotViolinMirror.tsx";
import "../Styles/violinPlot.css";

const HEADER_HEIGHT = 30;
const FOOTER_HEIGHT = 30;

const options = [
  {
    value: "linear",
    label: "Linear",
  },
  {
    value: "log2",
    label: "Log2",
  },
  {
    value: "logNorm",
    label: "LogNorm",
  },
];

export const BoxplotViolinMirrorDemo = ({ selectedGene, featureAnalysisType, setFeatureAnalysisType }) => {
  const containerRef = useRef(null);
  const [mirrorPosition, setMirrorPosition] = useState(0.5);
  const [violinPlotData, setViolinPlotData] = useState(null);
  const [smoothing, setSmoothing] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current as HTMLElement;
        setDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };
  
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
  
    handleResize();
  
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [selectedGene]);

  useEffect(() => {
    if (featureAnalysisType === "log2" && selectedGene) {
      fetch("/getLog2ViolinPlotData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gene: selectedGene }),
      })
        .then((response) => response.json())
        .then((data) => {
          setViolinPlotData(data.values);
        });
    } 

    if (featureAnalysisType === "logNorm" && selectedGene) {
      fetch("/getLogNormViolinPlotData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gene: selectedGene }),
      })
        .then((response) => response.json())
        .then((data) => {
          setViolinPlotData(data.values);
        });
    }

    if (featureAnalysisType === "linear" && selectedGene) {
      fetch("/getLinearViolinPlotData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gene: selectedGene }),
      })
        .then((response) => response.json())
        .then((data) => {
          setViolinPlotData(data.values);
        });
    }
  }, [selectedGene, featureAnalysisType]);

  const handleChange = (value) => {
    setFeatureAnalysisType(value);
  };

  return selectedGene ? (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <div
        style={{
          height: HEADER_HEIGHT,
          marginLeft: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className="controlGroup">
          <div className="text">Violin-Box Scale: </div>
          <input
            type="range"
            min={0}
            max={1}
            value={mirrorPosition}
            step={0.01}
            onChange={(e) => setMirrorPosition(Number(e.target.value))}
            style={{ height: 2, opacity: 0.5 }}
          />
          <div className="text">Scale Value: </div>
          <Select
            size="small"
            style={{
              width: 100,
            }}
            defaultValue="linear"
            options={options}
            onChange={handleChange}
          />
        </div>
      </div>
      {violinPlotData && (
        <BoxplotViolinMirror
          data={violinPlotData}
          width={dimensions.width}
          height={dimensions.height - HEADER_HEIGHT - FOOTER_HEIGHT}
          mirrorPosition={mirrorPosition}
          smoothing={smoothing}
        />
      )}
      <div
        style={{
          height: FOOTER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i style={{ color: "grey", fontSize: 14 }}>
          You can use{" "}
          <span
            style={{ color: "purple", cursor: "pointer" }}
            onClick={() => setSmoothing(true)}
          >
            smoothing
          </span>{" "}
          or{" "}
          <span
            style={{ color: "purple", cursor: "pointer" }}
            onClick={() => setSmoothing(false)}
          >
            steps
          </span>
          .
        </i>
      </div>
    </div>
  ) : (
    <Empty
      image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
      imageStyle={{
        height: 60,
      }}
      description={
        <Typography.Text>
          Choosing a gene from the gene list to display the violin plot.
        </Typography.Text>
      }
    />
  );
};
