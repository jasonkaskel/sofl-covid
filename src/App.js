import React from "react";
import moment from "moment";
import Plot from "react-plotly.js";
import "./App.css";

import flCases from "./fl_cases";

const SOFL_COUNTIES = ["Dade", "Broward", "Palm Beach"];
const App = () => {
  const allCases = flCases
    .reduce((obj, results) => {
      return [...obj, results.features];
    }, [])
    .flat();
  const uniqCases = {};
  allCases.forEach((row) => (uniqCases[row.attributes.OBJECTID] = row));
  const allFlCases = Object.values(uniqCases);

  const allByDate = {};
  allFlCases.forEach((row) => {
    const date = row.attributes.Report_Date;
    if (!allByDate[date]) allByDate[date] = 0;
    allByDate[date] += row.attributes["New_Cases"];
  });
  const allX = Object.keys(allByDate).sort((a, b) => (a > b ? 1 : -1));

  const soflCases = allFlCases.filter((row) =>
    SOFL_COUNTIES.includes(row.attributes.County)
  );
  const byDate = {};
  soflCases.forEach((row) => {
    const date = row.attributes.Report_Date;
    if (!byDate[date]) byDate[date] = 0;
    byDate[date] += row.attributes["New_Cases"];
  });

  return (
    <div className="App">
      <Plot
        data={[
          {
            x: allX.map((stamp) =>
              moment(Number.parseInt(stamp)).format("MMM Do")
            ),
            y: allX.map((stamp) => byDate[stamp] / 7),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "blue" },
            name: "South Florida",
          },
          {
            x: allX.map((stamp) =>
              moment(Number.parseInt(stamp)).format("MMM Do")
            ),
            y: allX.map((stamp) => allByDate[stamp] / 7),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "red" },
            name: "All Florida",
          },
        ]}
        layout={{
          autosize: true,
          title: "SoFl Covid Cases 7 day average (updated weekly on Mondays)",
        }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
      <br />
      <i>
        <a href="https://floridacovidaction-covidaction.hub.arcgis.com/datasets/3dab5ba14f1a46a69ca4586d95516ab2_0">
          source
        </a>
        : Florida Covid Action
      </i>
      <br />
      <br />
    </div>
  );
};
export default App;
