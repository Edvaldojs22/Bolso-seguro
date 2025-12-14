import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./features/auth/Login";
import Dashboard from "./features/pages/dashboard/Dashboard";
import Protect from "./features/auth/Protect";
import AuthProvider from "./features/auth/AuthProvider";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Rotas Protegidas */}
          <Route
            path="/dashboard"
            element={
              <Protect>
                <Dashboard />
              </Protect>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
