import { BrowserRouter, Routes as Switch } from "react-router-dom";
import Routes from "./router/router";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        {Routes}
      </Switch>
    </BrowserRouter>
  );
}

export default App;
