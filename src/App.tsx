import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AuthGuard from './components/AuthGuard'
import TripsWorking from './pages/TripsWorking'
import TripDetails from './pages/TripDetails'
import Passengers from './pages/Passengers'
import PassengerDetails from './pages/PassengerDetails'
import Account from './pages/Account'
import SeatSelection from './pages/SeatSelection'
import SimpleSeatSelection from './pages/SimpleSeatSelection'
import SimplifiedSeatSelection from './pages/SimplifiedSeatSelection'
import Login from './pages/Login'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/login" element={<Login />} />
        <Route path="/oauth2callback" element={<Login />} />

        {/* Protected routes - authentication required */}
        <Route path="/" element={
          <AuthGuard>
            <Layout>
              <TripsWorking />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/trips" element={
          <AuthGuard>
            <Layout>
              <TripsWorking />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/trips/:flightId" element={
          <AuthGuard>
            <Layout>
              <TripDetails />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/trips/:flightId/:ticketId" element={
          <AuthGuard>
            <Layout>
              <TripDetails />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/passengers" element={
          <AuthGuard>
            <Layout>
              <Passengers />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/passengers/:id" element={
          <AuthGuard>
            <Layout>
              <PassengerDetails />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/account" element={
          <AuthGuard>
            <Layout>
              <Account />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/seat-selection" element={
          <AuthGuard>
            <Layout>
              <SimplifiedSeatSelection />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/simplified-seat-selection" element={
          <AuthGuard>
            <Layout>
              <SimplifiedSeatSelection />
            </Layout>
          </AuthGuard>
        } />
      </Routes>
    </Router>
  )
}

export default App
