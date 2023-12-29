import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from "./pages/login"
import Signup from "./pages/signup"
import Dashboard from "./pages/dashboard"
import { UserProvider } from './UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
