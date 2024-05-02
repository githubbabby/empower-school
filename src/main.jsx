import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.locale("es");
dayjs.extend(relativeTime);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
