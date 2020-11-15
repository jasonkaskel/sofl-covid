import React from "react";
import moment from "moment";
import Plot from "react-plotly.js";
import "./App.css";

import casesByCountyAndDate from "./fl_case_line_data";
import serologyByCountyAndDateRaw from "./fl_serology";

const normalizeSerology = (dates) => {
  const normalized = {};
  Object.keys(serologyByCountyAndDateRaw).forEach((county) => {
    normalized[county] = {};
    Object.keys(serologyByCountyAndDateRaw[county]).forEach((stamp) => {
      const totalTests = sumSerology(serologyByCountyAndDateRaw[county][stamp]);
      const avgDaily = Math.round(totalTests / 7);
      const avgPositive = Math.round(
        (serologyByCountyAndDateRaw[county][stamp]?.positive || 0) / 7
      );
      const positivityRate = (
        (serologyByCountyAndDateRaw[county][stamp].positive / totalTests) *
        100
      ).toFixed(2);
      const date = moment(Number.parseInt(stamp));
      for (var i = 0; i < 7; i++) {
        const normalizedDate = date
          .clone()
          .subtract(i, "days")
          .startOf("day")
          .valueOf();
        if (!dates.includes(normalizedDate.toString())) {
          console.log(`${normalizedDate} not in`, dates);
        }
        normalized[county][normalizedDate] = {
          total: avgDaily,
          positive: avgPositive,
          rate: positivityRate,
        };
      }
    });
  });

  return normalized;
};

const SOFL_COUNTIES = ["Dade", "Broward", "Palm Beach"];
const formatDate = (stamp) => moment(Number.parseInt(stamp)).format("MMM Do");
const avgCases = (source, dates) =>
  Math.round(
    dates.reduce((sum, date) => {
      return sum + source[date];
    }, 0) / dates.length
  );
const sumSerology = (obj) =>
  obj ? obj.positive + obj.negative + obj.inconclusive : 0;

const App = () => {
  const allDates = [
    ...new Set(
      Object.values(casesByCountyAndDate)
        .map((h) => Object.keys(h))
        .flat()
    ),
  ].sort((a, b) => (a > b ? 1 : -1));
  const serologyByCountyAndDate = normalizeSerology(allDates);
  const totalCasesByDate = {};
  const soflCasesByDate = {};
  const totalSerologyByDate = {};
  const soflSerologyByDate = {};
  allDates.forEach((stamp, i) => {
    totalCasesByDate[stamp] = Object.values(casesByCountyAndDate)
      .map((obj) => obj[stamp])
      .reduce((sum, count) => {
        return sum + (count || 0);
      }, 0);
    soflCasesByDate[stamp] = SOFL_COUNTIES.reduce((sum, county) => {
      return sum + (casesByCountyAndDate[county][stamp] || 0);
    }, 0);
    const serologySum = Object.values(serologyByCountyAndDate)
      .map((obj) => obj[stamp])
      .reduce((sum, values) => {
        return sum + (values?.total || 0);
      }, 0);
    const positiveSerologySum = Object.values(serologyByCountyAndDate)
      .map((obj) => obj[stamp])
      .reduce((sum, values) => {
        return sum + (values?.positive || 0);
      }, 0);
    totalSerologyByDate[stamp] = {
      total: serologySum,
      rate: ((positiveSerologySum / serologySum) * 100).toFixed(2),
    };
    const soflSerologySum = SOFL_COUNTIES.reduce((sum, county) => {
      return sum + (serologyByCountyAndDate[county][stamp]?.total || 0);
    }, 0);
    const positiveSoflSerologySum = SOFL_COUNTIES.reduce((sum, county) => {
      return sum + (serologyByCountyAndDate[county][stamp]?.positive || 0);
    }, 0);
    soflSerologyByDate[stamp] = {
      total: soflSerologySum,
      rate: ((positiveSoflSerologySum / soflSerologySum) * 100).toFixed(2),
    };
  });
  const browardCasesByDate = casesByCountyAndDate["Broward"];
  const dadeCasesByDate = casesByCountyAndDate["Dade"];
  const palmBeachCasesByDate = casesByCountyAndDate["Palm Beach"];
  const firstTestingDateIndex = allDates.findIndex(
    (stamp) => totalSerologyByDate[stamp].total > 0
  );
  const allTestingDates = allDates.slice(firstTestingDateIndex);

  return (
    <div className="App">
      <Plot
        data={[
          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp) => totalCasesByDate[stamp] || 0),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#fd9e9e" },
            name: "Florida (total)",
          },

          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp, i) =>
              avgCases(totalCasesByDate, allDates.slice(i - 6, i + 1))
            ),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "red" },
            name: "Florida (weekly avg)",
          },
          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp) => soflCasesByDate[stamp] || 0),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#61699e" },
            name: "SoFl (total)",
          },

          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp, i) =>
              avgCases(soflCasesByDate, allDates.slice(i - 6, i + 1))
            ),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "blue" },
            name: "SoFl (weekly avg)",
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
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp) => browardCasesByDate[stamp] || 0),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#61699e" },
            name: "Broward (total)",
          },
          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp, i) =>
              avgCases(browardCasesByDate, allDates.slice(i - 6, i + 1))
            ),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "blue" },
            name: "Broward (weekly avg)",
          },
          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp) => dadeCasesByDate[stamp] || 0),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#fd9e9e" },
            name: "Dade (total)",
          },
          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp, i) =>
              avgCases(dadeCasesByDate, allDates.slice(i - 6, i + 1))
            ),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "red" },
            name: "Dade (weekly avg)",
          },

          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp) => palmBeachCasesByDate[stamp] || 0),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#8df00f" },
            name: "Palm Beach (total)",
          },
          {
            x: allDates.map((stamp) => formatDate(stamp)),
            y: allDates.map((stamp, i) =>
              avgCases(palmBeachCasesByDate, allDates.slice(i - 6, i + 1))
            ),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "green" },
            name: "Palm Beach (weekly avg)",
          },
        ]}
        layout={{
          autosize: true,
          title: "SoFl Detail Covid Cases",
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
            x: allTestingDates.map((stamp) => formatDate(stamp)),
            y: allTestingDates.map(
              (stamp) => totalSerologyByDate[stamp]?.total || 0
            ),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#fd9e9e" },
            name: "All Florida (total)",
          },
          {
            x: allTestingDates.map((stamp) => formatDate(stamp)),
            y: allTestingDates.map(
              (stamp) => soflSerologyByDate[stamp]?.total || 0
            ),
            type: "bar",
            mode: "lines+markers",
            marker: { color: "#61699e" },
            name: "SoFl (total)",
          },
          {
            x: allTestingDates.map((stamp) => formatDate(stamp)),
            y: allTestingDates.map(
              (stamp) => totalSerologyByDate[stamp]?.rate || null
            ),
            yaxis: "y2",
            type: "scatter",
            marker: { color: "red" },
            name: "All Florida (rate)",
          },
          {
            x: allTestingDates.map((stamp) => formatDate(stamp)),
            y: allTestingDates.map(
              (stamp) => soflSerologyByDate[stamp]?.rate || null
            ),
            yaxis: "y2",
            type: "scatter",
            marker: { color: "blue" },
            name: "SoFL (rate)",
          },
          {
            x: allTestingDates.map((stamp) => formatDate(stamp)),
            y: allTestingDates.map((stamp) =>
              totalSerologyByDate[stamp]?.total
                ? Math.floor(
                    (soflSerologyByDate[stamp]?.total /
                      totalSerologyByDate[stamp]?.total) *
                      100
                  )
                : null
            ),
            yaxis: "y3",
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "green" },
            name: "Total test ratio",
          },
        ]}
        layout={{
          autosize: true,
          title: "SoFl Detail Testing",
          yaxis: {
            rangemode: "tozero",
          },
          yaxis2: {
            title: "Positivity Rate",
            titlefont: { color: "rgb(148, 103, 189)" },
            tickfont: { color: "rgb(148, 103, 189)" },
            overlaying: "y",
            side: "right",
            range: [0, 25],
          },
          yaxis3: {
            title: "SoFL / Florida total test ratio",
            titlefont: { color: "rgb(148, 103, 189)" },
            tickfont: { color: "rgb(148, 103, 189)" },
            overlaying: "y",
            side: "left",
            range: [0, 100],
          },
        }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
      <br />
      <i>
        by <a href="https://twitter.com/jason_kaskel?lang=en">@jason_kaskel</a>{" "}
        | <a href="https://floridahealthcovid19.gov/#latest-stats">source</a>
      </i>
      <br />
      <br />
    </div>
  );
};
export default App;
