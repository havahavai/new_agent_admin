import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getUserSpecificInfo, getFlightDataByIds } from '@/api'

const ApiTest = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flightId, setFlightId] = useState('65780')
  const [ticketId, setTicketId] = useState('62764')

  const testGetUserSpecificInfo = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await getUserSpecificInfo()
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testGetFlightDataByIds = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await getFlightDataByIds(flightId, ticketId)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">API Integration Test</h1>
      
      <div className="grid gap-6">
        {/* Test getUserSpecificInfo */}
        <Card>
          <CardHeader>
            <CardTitle>Test getUserSpecificInfo API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGetUserSpecificInfo} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Loading...' : 'Test getUserSpecificInfo'}
            </Button>
          </CardContent>
        </Card>

        {/* Test getFlightDataByIds */}
        <Card>
          <CardHeader>
            <CardTitle>Test getFlightDataByIds API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Flight ID</label>
                <Input
                  value={flightId}
                  onChange={(e) => setFlightId(e.target.value)}
                  placeholder="Enter flight ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ticket ID</label>
                <Input
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="Enter ticket ID"
                />
              </div>
            </div>
            <Button 
              onClick={testGetFlightDataByIds} 
              disabled={loading || !flightId || !ticketId}
              className="mb-4"
            >
              {loading ? 'Loading...' : 'Test getFlightDataByIds'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-600">API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ApiTest
