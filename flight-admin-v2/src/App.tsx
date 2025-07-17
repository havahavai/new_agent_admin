import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import TripsWorking from './pages/TripsWorking'
import TripDetails from './pages/TripDetails'
import Passengers from './pages/Passengers'
import PassengerDetails from './pages/PassengerDetails'
import Account from './pages/Account'
import SeatSelection from './pages/SeatSelection'
import SimpleSeatSelection from './pages/SimpleSeatSelection'
import SimplifiedSeatSelection from './pages/SimplifiedSeatSelection'
import TestPage from './pages/TestPage'
import ApiTest from './pages/ApiTest'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TripsWorking />} />
          <Route path="/trips" element={<TripsWorking />} />
          <Route path="/trips/:flightId" element={<TripDetails />} />
          <Route path="/trips/:flightId/:ticketId" element={<TripDetails />} />
          <Route path="/passengers" element={<Passengers />} />
          <Route path="/passengers/:id" element={<PassengerDetails />} />
          <Route path="/account" element={<Account />} />
          <Route path="/seat-selection" element={<SimplifiedSeatSelection />} />
          <Route path="/simplified-seat-selection" element={<SimplifiedSeatSelection />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/api-test" element={<ApiTest />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
