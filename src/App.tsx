
import { BrowserRouter as Router, Routes, Route, } from 'react-router-dom';
import LandingPage from './pages/home';
import Dashboard from './pages/dashboard';
import { FApp } from './future-city/app';

export default function App() {


  return (
    <Router> {/* Wrap your entire app with Router */}
      <>
        <Routes> {/* Define your routes here */}
          <Route path="/" element={<LandingPage/>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fapp" element={<FApp />} />

        </Routes>
      </>
    </Router>

  );
}
