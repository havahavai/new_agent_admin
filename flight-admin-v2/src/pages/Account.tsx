import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wallet, Plus, LogOut } from 'lucide-react'
import { useState } from 'react'
// import SeatPreferenceWidgetSimple from '@/components/SeatPreferenceWidgetSimple'
import SimpleSeatWidget from '@/components/SimpleSeatWidget'

const Account = () => {
  const [balance, setBalance] = useState(1250.75)
  const [addAmount, setAddAmount] = useState('')

  const handleAddBalance = () => {
    const amount = parseFloat(addAmount)
    if (amount > 0) {
      setBalance(prev => prev + amount)
      setAddAmount('')
    }
  }

  const handleLogout = () => {
    // In a real app, this would clear authentication tokens and redirect
    alert('Logout functionality would be implemented here')
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account</h1>
          <p className="mt-2 text-gray-600">Manage your profile and account settings</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      {/* Balance Widget */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-white text-lg">
            <Wallet className="mr-2 h-5 w-5 flex-shrink-0" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-bold">${balance.toFixed(2)}</div>
              <p className="text-blue-100 text-sm">Available for bookings</p>
            </div>
            <div className="flex flex-col space-y-2 sm:items-end">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full sm:w-24 bg-white text-gray-900 text-sm"
                  min="0"
                  step="0.01"
                />
                <Button
                  onClick={handleAddBalance}
                  variant="secondary"
                  size="sm"
                  disabled={!addAmount || parseFloat(addAmount) <= 0}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
                  Add Balance
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <SimpleSeatWidget />
    </div>
  )
}

export default Account
