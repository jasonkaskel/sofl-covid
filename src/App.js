import React from "react";
import moment from "moment";
import Plot from "react-plotly.js";
import "./App.css";

import casesByCountyAndDate from "./fl_case_line_data";

const SOFL_COUNTIES = ["Dade", "Broward", "Palm Beach"];
const formatDate = (stamp) => moment(Number.parseInt(stamp)).format("MMM Do");
const avg = (ary, source) =>
  Math.round(
    ary.reduce((sum, date) => {
      return sum + source[date].total;
    }, 0) / 7
  );

const App = () => {
  const allByDate = {};
  const soflByDate = {};
  const browardByDate = {};
  const dadeByDate = {};
  const palmBeachByDate = {};
  Object.keys(casesByCountyAndDate).forEach((county) => {
    Object.keys(casesByCountyAndDate[county]).forEach((date) => {
      const normalizedDate = moment(Number.parseInt(date))
        .startOf("day")
        .valueOf();
      if (!allByDate[normalizedDate])
        allByDate[normalizedDate] = { total: 0, weekly_avg: 0 };
      if (!soflByDate[normalizedDate])
        soflByDate[normalizedDate] = { total: 0, weekly_avg: 0 };
      if (!browardByDate[normalizedDate])
        browardByDate[normalizedDate] = { total: 0, weekly_avg: 0 };
      if (!dadeByDate[normalizedDate])
        dadeByDate[normalizedDate] = { total: 0, weekly_avg: 0 };
      if (!palmBeachByDate[normalizedDate])
        palmBeachByDate[normalizedDate] = { total: 0, weekly_avg: 0 };
      allByDate[normalizedDate].total += casesByCountyAndDate[county][date];
      if (SOFL_COUNTIES.includes(county)) {
        soflByDate[normalizedDate].total += casesByCountyAndDate[county][date];
        if (county === "Broward") {
          browardByDate[normalizedDate].total +=
            casesByCountyAndDate[county][date];
        } else if (county === "Dade") {
          dadeByDate[normalizedDate].total +=
            casesByCountyAndDate[county][date];
        } else if (county === "Palm Beach") {
          palmBeachByDate[normalizedDate].total +=
            casesByCountyAndDate[county][date];
        }
      }
    });
  });
  const allX = Object.keys(allByDate).sort((a, b) => (a > b ? 1 : -1));
  allX.forEach((normalizedDate, i) => {
    const from = i >= 6 ? i - 6 : 0;
    allByDate[normalizedDate].weekly_avg = avg(
      allX.slice(from, i + 1),
      allByDate
    );
    soflByDate[normalizedDate].weekly_avg = avg(
      allX.slice(from, i + 1),
      soflByDate
    );
    browardByDate[normalizedDate].weekly_avg = avg(
      allX.slice(from, i + 1),
      browardByDate
    );
    dadeByDate[normalizedDate].weekly_avg = avg(
      allX.slice(from, i + 1),
      dadeByDate
    );
    palmBeachByDate[normalizedDate].weekly_avg = avg(
      allX.slice(from, i + 1),
      palmBeachByDate
    );
  });

  return (
    <div className="App">
      <Plot
        data={[
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(allByDate[stamp].weekly_avg)),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "red" },
            name: "All Florida",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(soflByDate[stamp].weekly_avg)),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "blue" },
            name: "South Florida (trailing average)",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(allByDate[stamp].total)),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#fd9e9e" },
            name: "All Florida (total)",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(soflByDate[stamp].total)),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#61699e" },
            name: "South Florida (total)",
          },
        ]}
        layout={{
          autosize: true,
          title: "SoFl Covid Cases",
          yaxis: {
            rangemode: "tozero",
          },
        }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
      <br />
      <Plot
        data={[
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(browardByDate[stamp].weekly_avg)),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "blue" },
            name: "Broward",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(dadeByDate[stamp].weekly_avg)),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "red" },
            name: "Dade",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) =>
              Math.round(palmBeachByDate[stamp].weekly_avg)
            ),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "green" },
            name: "Palm Beach",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(browardByDate[stamp].total)),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#61699e" },
            name: "Broward (total)",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(dadeByDate[stamp].total)),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#fd9e9e" },
            name: "Dade (total)",
          },
          {
            x: allX.map((stamp) => formatDate(stamp)),
            y: allX.map((stamp) => Math.round(palmBeachByDate[stamp].total)),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#8df00f" },
            name: "Palm Beach (total)",
          },
        ]}
        layout={{
          autosize: true,
          title: "SoFl Covid Case Details",
          yaxis: {
            rangemode: "tozero",
          },
        }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
      <br />
      <i>
        by <a href="https://twitter.com/jason_kaskel?lang=en">@jason_kaskel</a>{" "}
        |{" "}
        <a href="https://floridacovidaction-covidaction.hub.arcgis.com/datasets/8b717eb5bf264374965e8b7315ca6436_0/data">
          source
        </a>{" "}
        Florida Covid Action
      </i>{" "}
      <br />
      <br />
    </div>
  );
};
export default App;
