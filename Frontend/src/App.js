import './App.css';
import React, { useEffect, useState, useMemo } from "react";
import { Card, Slider, Switch, Checkbox, Tooltip, Spin, Select } from "antd";
import { ChromePicker } from 'react-color';
import { defaultColors, colorbrewer2, saturatedColorBrewer2, rainbowColors } from './components/colorSchemes';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { KosaraChart } from './components/kosaraChart';
import { CellAnalysisChart } from './components/cellAnalysisChart';
import { DifferentialChart } from './components/differentialChart';
import { GeneList } from './components/geneList';
import { GradientLegend } from './components/gradientLegend';

function App() {
  const [kosaraData, setKosaraData] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [hoveronTSNECell, setHoveronTSNECell] = useState(null);
  const [showBackgroundImage, setShowBackgroundImage] = useState(true);
  const [showKosaraCharts, setShowKosaraCharts] = useState(true);
  const [UMITotalCounts, setUMITotalCounts] = useState({});
  const [opacity, setOpacity] = useState(1);
  const [selectedGene, setSelectedGene] = useState(null);
  const [relatedGeneData, setRelatedGeneData] = useState(null);
  const [geneExpressionScale, setGeneExpressionScale] = useState([]);
  const [showtSNECluster, setShowtSNECluster] = useState(false);
  const [tissueClusterData, setTissueClusterData] = useState([]);
  const [featureAnalysisType, setFeatureAnalysisType] = useState("linear");
  const [interestedCellType, setInterestedCellType] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(null);
  const [colorScheme, setColorScheme] = useState(saturatedColorBrewer2);
  const [cellShownStatus, setCellShownStatus] = useState({
    X1: true,
    X2: true,
    X3: true,
    X4: true,
    X5: true,
    X6: true,
    X7: true,
    X8: true,
    X9: true
  });
  const [arrow, setArrow] = useState('Show');
  const mergedArrow = useMemo(() => {
    if (arrow === 'Hide') {
      return false;
    }
    if (arrow === 'Show') {
      return true;
    }
    return {
      pointAtCenter: true,
    };
  }, [arrow]);

  const togglePicker = (key) => {
    setPickerVisible(pickerVisible === key ? null : key);
  };

  const customColorChange = (key, newColor) => {
    setColorScheme((prevScheme) => ({
      ...prevScheme,
      [key]: newColor.hex,
    }));
  };

  useEffect(() => {
    if (selectedGene !== null) {
      setShowKosaraCharts(false);
    }
  }, [selectedGene]);

  // Initialize color scheme
  useEffect(() => {
    console.log('Color scheme initialized:', colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    if (!showKosaraCharts && selectedGene === null && !showtSNECluster) {
      fetch("/getUMITotalCounts")
        .then(res => res.json())
        .then(data => {
          setUMITotalCounts(data);
        });
    } else {
      setUMITotalCounts({});
      fetch("./getCellClusterUMItsne")
        .then(res => res.json())
        .then(data => {
          setTissueClusterData(data);
        });
    }
  }, [showKosaraCharts, selectedGene]);

  const opacityChange = (value) => {
    setOpacity(value);
  }

  const kosaraChartsChange = (value) => {
    setShowKosaraCharts(value);
    setSelectedGene(null);
  }

  const onChangeShowCell = (cell) => {
    return (event) => {
      setCellShownStatus({ ...cellShownStatus, [cell]: event.target.checked });
    }
  }

  const colorSelectChange = (value) => {
    let selectedColors;

    if (value === 'rainbowColors') {
      selectedColors = rainbowColors;
    } else if (value === 'colorbrewer2') {
      selectedColors = colorbrewer2;
    } else if (value === 'saturatedColorBrewer2') {
      selectedColors = saturatedColorBrewer2;
    } else {
      selectedColors = defaultColors;
    }

    setColorScheme(selectedColors);
  }

  return (
    <div className="App">
      {/* Button groups */}
      <Card
        size="small"
        title={
          <span>
            Tools
            <Tooltip placement="right" title={"Control the entire inferface collection. In Kosara mode, you can select the cell type you are interested in to display. In Gene mode, you can display the number of UMIs of the gene you are interested in."} overlayInnerStyle={{ color: '#000' }} color={"white"}>
              <QuestionCircleOutlined style={{ marginLeft: 3, fontSize: 10 }} />
            </Tooltip>
          </span>}
        style={{
          width: "280px",
          height: "99vh",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* backgroundImage Switch and Kosara Charts Mode Switch */}
          <Switch style={{ margin: 2 }} onChange={() => setShowBackgroundImage(!showBackgroundImage)} checkedChildren="Hide Background Image" unCheckedChildren="Show Background Image" checked={showBackgroundImage} />
          <Switch style={{ margin: 2, backgroundColor: showKosaraCharts ? '#ED9121' : '#74C365' }} onChange={kosaraChartsChange} checked={showKosaraCharts} checkedChildren="Kosara Charts Mode" unCheckedChildren="Gene Mode" />

          {/* plots on tissue opacity Slider */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <h5 style={{ marginBottom: 5, marginTop: 5, fontWeight: 500 }}>Opacity</h5>
            <Tooltip placement="right" title={"Slided the bar to see the relationship of the cell types and the tissue"} overlayInnerStyle={{ color: '#000' }} color={"white"} arrow={mergedArrow}>
              <QuestionCircleOutlined style={{ marginLeft: 3, fontSize: 10 }} />
            </Tooltip>
          </div>
          <Slider style={{ margin: 5 }} defaultValue={1} onChange={opacityChange} step={0.1} max={1} min={0} />

          {/* Color Scheme Select */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <h5 style={{ marginBottom: 5, marginTop: 5, fontWeight: 500 }}>Color Scale</h5>
            <Tooltip placement="right" title={"Choosing your suitable color scheme for cell type X1 to X9"} overlayInnerStyle={{ color: '#000' }} color={"white"} arrow={mergedArrow}>
              <QuestionCircleOutlined style={{ marginLeft: 3, fontSize: 10 }} />
            </Tooltip>
          </div>
          <Select
            size='small'
            defaultValue="saturatedColorBrewer2"
            style={{ margin: 5 }}
            onChange={colorSelectChange}
            options={[
              {
                value: 'colorbrewer2',
                label: 'Colorbrewer2'
              },
              {
                value: 'saturatedColorBrewer2',
                label: 'Saturated ColorBrewer2'
              },
              {
                value: 'defaultColors',
                label: 'Default Colors'
              },
              {
                value: 'rainbowColors',
                label: 'Rainbow Colors'
              }
            ]}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 10, justifyContent: 'space-between' }}>
            {Object.entries(colorScheme).map(([key, color]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', marginRight: 10, marginBottom: 5 }}>
                <Checkbox checked={cellShownStatus[key]} onChange={onChangeShowCell(key)} disabled={!showKosaraCharts} style={{
                  "--background-color": color,
                  "--border-color": color,
                }} />
                <div
                  style={{ width: 15, height: 15, backgroundColor: color, marginLeft: 3, cursor: 'pointer' }}
                  onClick={() => togglePicker(key)}
                />
                {pickerVisible === key && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <div
                      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}
                      onClick={() => setPickerVisible(null)}
                    />
                    <div onClick={(e) => e.stopPropagation()}>
                      <ChromePicker
                        disableAlpha
                        color={color}
                        onChange={(newColor) => customColorChange(key, newColor)}
                      />
                    </div>
                  </div>
                )}
                <span style={{ marginLeft: 5 }}>{key}</span>
              </div>
            ))}
          </div>

          {/* UMI counts Legend */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <h5 style={{ marginBottom: 5, marginTop: 5, fontWeight: 500 }}>UMI counts Legend</h5>
            <Tooltip placement="right" title={"Searching a gene and choose to show the specific gene expression value scale"} overlayInnerStyle={{ color: '#000' }} color={"white"} arrow={mergedArrow}>
              <QuestionCircleOutlined style={{ marginLeft: 3, fontSize: 10 }} />
            </Tooltip>
          </div>
          {showKosaraCharts || showtSNECluster ?
            <GradientLegend selectedGene={selectedGene} min={geneExpressionScale[0]} max={geneExpressionScale[geneExpressionScale.length - 1]} showKosaraCharts={showKosaraCharts} colorScaleType="Grey" />
            :
            <GradientLegend selectedGene={selectedGene} min={geneExpressionScale[0]} max={geneExpressionScale[geneExpressionScale.length - 1]} showKosaraCharts={showKosaraCharts} colorScaleType="Orange" />
          }

          {/* Gene List Card */}
          <GeneList
            setShowtSNECluster={setShowtSNECluster}
            selectedGene={selectedGene}
            featureAnalysisType={featureAnalysisType}
            setSelectedGene={setSelectedGene}
            setRelatedGeneData={setRelatedGeneData}
          />
        </div>
      </Card>
      <KosaraChart
        className="KosaraChart"
        colorScheme={colorScheme}
        kosaraData={kosaraData}
        setKosaraData={setKosaraData}
        setSelectedData={setSelectedData}
        interestedCellType={interestedCellType}
        showBackgroundImage={showBackgroundImage}
        showKosaraCharts={showKosaraCharts}
        cellShownStatus={cellShownStatus}
        hoveronTSNECell={hoveronTSNECell}
        opacity={opacity}
        relatedGeneData={relatedGeneData}
        selectedGene={selectedGene}
        showtSNECluster={showtSNECluster}
        UMITotalCounts={UMITotalCounts}
        tissueClusterData={tissueClusterData}
        setGeneExpressionScale={setGeneExpressionScale}
      />
      <div className="analysisGroup">
        <CellAnalysisChart
          colorScheme={colorScheme}
          interestedCellType={interestedCellType}
          setInterestedCellType={setInterestedCellType}
          showKosaraCharts={showKosaraCharts}
          setShowKosaraCharts={setShowKosaraCharts}
          selectedData={selectedData}
          setHoveronTSNECell={setHoveronTSNECell}
          showtSNECluster={showtSNECluster}
          setShowtSNECluster={setShowtSNECluster}
        />
        <DifferentialChart selectedGene={selectedGene} featureAnalysisType={featureAnalysisType} setFeatureAnalysisType={setFeatureAnalysisType} />
      </div>

      {/* loading */}
      {kosaraData.length === 0 && (
        <Spin size="large" spinning={true} fullscreen tip="Loading Data..." />
      )}
    </div>
  );
}

export default App;
