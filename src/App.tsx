import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AuthGuard from './components/AuthGuard'
import ApiCallMonitor from './components/ApiCallMonitor'
import TripsWorking from './pages/TripsWorking'
import BookingCalendar from './pages/BookingCalendar'
import Trips from './pages/Trips'
import Clients from './pages/Clients'
import TripDetails from './pages/TripDetails'
import Passengers from './pages/Passengers'
import PassengerDetails from './pages/PassengerDetails'
import Account from './pages/Account'
import SeatSelection from './pages/SeatSelection'
import SimpleSeatSelection from './pages/SimpleSeatSelection'
import SimplifiedSeatSelection from './pages/SimplifiedSeatSelection'
import Login from './pages/Login'
import EmailBoxes from './pages/EmailBoxes'

function App() {
  return (
    <Router>
      <ApiCallMonitor />
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/login" element={<Login />} />
        <Route path="/oauth2callback" element={<Login />} />

        {/* Protected routes - authentication required */}
        <Route path="/" element={
          <AuthGuard>
            <Layout>
              <BookingCalendar />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/booking-calendar" element={
          <AuthGuard>
            <Layout>
              <BookingCalendar />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/trips" element={
          <AuthGuard>
            <Layout>
              <Trips />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/clients" element={
          <AuthGuard>
            <Layout>
              <Clients />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/trips/:ticketId" element={
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
        <Route path="/email-boxes" element={
          <AuthGuard>
            <Layout>
              <EmailBoxes />
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
