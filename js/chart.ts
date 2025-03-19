import dayjs from "dayjs";
import {
  dataLabelsStatusColor,
  dataStatusColor,
  DataValue,
  fromDateStr,
} from "./util";

const ECHARTS_DATE_FORMAT = "{d} {MMM}";

const toolbox = {
  feature: {
    saveAsImage: {
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#f0f0f0", // Light grey color
      name: 'xplot-mrplot-' + (function() {
        const now = new Date();
        return now.getFullYear() + 
               ('0' + (now.getMonth() + 1)).slice(-2) + 
               ('0' + now.getDate()).slice(-2) + '-' +
               ('0' + now.getHours()).slice(-2) +
               ('0' + now.getMinutes()).slice(-2);
      })()
    }
  }
};

// Modified function in chart.ts
export function calculateNiceInterval(dataValues: DataValue[][], maxDivisions = 7) {
  // Extract all numeric values from the data
  const values = dataValues.flatMap(series => 
    series.map(point => point.value)
  ).filter(value => typeof value === 'number' && !isNaN(value));
  
  // If no valid values, return a default interval
  if (values.length === 0) return 1;
  
  // Find min and max values
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate the range
  const range = max - min;
  
  // For very small numbers, just use 1 as the interval
  if (max < 10) return 1;
  
  // Calculate a raw interval to ensure we don't exceed maxDivisions
  // We subtract 1 because the number of divisions is (max-min)/interval + 1
  let rawInterval = range / (maxDivisions - 1);
  
  // Find the magnitude of the raw interval
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  
  // Calculate normalized interval (between 1 and 10)
  const normalizedInterval = rawInterval / magnitude;
  
  // Choose a nice interval based on the normalized value
  let niceInterval;
  if (normalizedInterval <= 1) {
    niceInterval = 1;
  } else if (normalizedInterval <= 2) {
    niceInterval = 2;
  } else if (normalizedInterval <= 5) {
    niceInterval = 5;
  } else {
    niceInterval = 10;
  }
  
  // Scale back to the original magnitude
  const interval = niceInterval * magnitude;
  
  // Double-check that our interval won't result in too many divisions
  const divisions = Math.ceil(range / interval) + 1;
  if (divisions > maxDivisions) {
    // If we'd get too many divisions, bump up to the next nice interval
    if (niceInterval === 1) return 2 * magnitude;
    if (niceInterval === 2) return 5 * magnitude;
    return 10 * magnitude;
  }
  
  return interval;
}

// Replace the background configuration
const backgroundColor = "#f0f0f0"; // Light grey color

const xAxis = {
  type: "time",
  axisLabel: {
    formatter: ECHARTS_DATE_FORMAT,
    hideOverlap: true,
    color: "#000",
  },
  axisLine: {
    lineStyle: {
      color: "#000",
    },
  },
};

// Define the yAxis without the calculateNiceInterval call that references undefined data
const yAxis = {
  splitLine: {
    show: false,
  },
  axisLabel: {
    name: "",
    fontSize: 11,
    color: "#000",
    hideOverlap: true,
  },
  // Remove this line: interval: calculateNiceInterval(dataValues),
  nameLocation: "middle",
  nameRotate: 90,
  nameGap: 40,
  nameTextStyle: {
    color: "#000",
  },
};

export const chartBaseOptions = {
  toolbox,
  backgroundColor,
  xAxis,
  yAxis,
  title: {
    left: "center",
    triggerEvent: true,
  },
  tooltip: {
    show: true,
  },
};

const mapDataValueToChartDataPoint = (dv: DataValue) => ({
  value: [fromDateStr(dv.x), dv.value],
  itemStyle: {
    color: dataStatusColor(dv.status),
  },
  label: {
    show: false,
    color: dataLabelsStatusColor(dv.status),
    fontWeight: "bold",
    fontSize: 10,
  },
  tooltip: {
    formatter: `${dayjs(dv.x).format("ddd, MMM DD, YYYY")}:<br/> ${dv.value}`,
  },
});

export const mapDataValuesToChartSeries = (subD: DataValue[], i: number) => ({
  name: `${i}-data`,
  z: 98,
  type: "line",
  symbol: "circle",
  symbolSize: 4,
  lineStyle: {
    color: "#000",
  },
  data: subD.map(mapDataValueToChartDataPoint),
});