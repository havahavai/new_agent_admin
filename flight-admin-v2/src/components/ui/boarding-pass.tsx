import React from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Download, Plane } from 'lucide-react'
import { type BoardingPass as BoardingPassType } from '@/data/flights'

interface BoardingPassProps {
  boardingPass: BoardingPassType
  passengerName: string
  onDownload: (boardingPass: BoardingPassType) => void
}

export const BoardingPass: React.FC<BoardingPassProps> = ({
  boardingPass,
  passengerName,
  onDownload
}) => {
  const handleDownload = () => {
    onDownload(boardingPass)
  }

  const generatePrintableBoardingPass = () => {
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                BOARDING PASS                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  PASSENGER: ${passengerName.padEnd(25)} FLIGHT: ${boardingPass.flightNumber.padEnd(10)}        ║
║                                                                              ║
║  FROM: ${boardingPass.route.fromCode.padEnd(3)} ${boardingPass.route.from.padEnd(20)} TO: ${boardingPass.route.toCode.padEnd(3)} ${boardingPass.route.to.padEnd(15)} ║
║                                                                              ║
║  DATE: ${boardingPass.date.padEnd(12)} DEPARTURE: ${boardingPass.departure.padEnd(8)} SEAT: ${boardingPass.seatNumber.padEnd(4)}     ║
║                                                                              ║
║  GATE: ${boardingPass.gate.padEnd(4)} BOARDING GROUP: ${boardingPass.boardingGroup.padEnd(8)} CLASS: ${boardingPass.ticketClass.padEnd(12)} ║
║                                                                              ║
║  ${boardingPass.barcode.padEnd(70)} ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `.trim()
  }

  const downloadAsText = () => {
    const content = generatePrintableBoardingPass()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boarding-pass-${boardingPass.flightNumber}-${passengerName.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAsHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Boarding Pass - ${boardingPass.flightNumber}</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background: #f5f5f5; }
        .boarding-pass { 
            background: white; 
            border: 2px dashed #333; 
            padding: 20px; 
            max-width: 600px; 
            margin: 0 auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .section { margin: 15px 0; }
        .label { font-weight: bold; display: inline-block; width: 120px; }
        .barcode { 
            text-align: center; 
            font-size: 18px; 
            font-weight: bold; 
            background: #f0f0f0; 
            padding: 10px; 
            margin: 20px 0;
            border: 1px solid #ccc;
        }
        .route { font-size: 18px; text-align: center; margin: 20px 0; }
        @media print { body { background: white; } .boarding-pass { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="boarding-pass">
        <div class="header">✈ BOARDING PASS ✈</div>
        
        <div class="section">
            <span class="label">PASSENGER:</span> ${passengerName}
        </div>
        
        <div class="section">
            <span class="label">FLIGHT:</span> ${boardingPass.flightNumber}
        </div>
        
        <div class="route">
            ${boardingPass.route.from} (${boardingPass.route.fromCode}) → ${boardingPass.route.to} (${boardingPass.route.toCode})
        </div>
        
        <div class="section">
            <span class="label">DATE:</span> ${boardingPass.date}
        </div>
        
        <div class="section">
            <span class="label">DEPARTURE:</span> ${boardingPass.departure}
        </div>
        
        <div class="section">
            <span class="label">SEAT:</span> ${boardingPass.seatNumber}
        </div>
        
        <div class="section">
            <span class="label">GATE:</span> ${boardingPass.gate}
        </div>
        
        <div class="section">
            <span class="label">BOARDING GROUP:</span> ${boardingPass.boardingGroup}
        </div>
        
        <div class="section">
            <span class="label">CLASS:</span> ${boardingPass.ticketClass}
        </div>
        
        <div class="barcode">
            ${boardingPass.barcode}
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px;">
            Issued: ${new Date(boardingPass.issuedAt).toLocaleString()}
        </div>
    </div>
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boarding-pass-${boardingPass.flightNumber}-${passengerName.replace(/\s+/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-white">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">BOARDING PASS</h3>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadAsText}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Text</span>
                </Button>
                <Button
                  size="sm"
                  onClick={downloadAsHTML}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">HTML</span>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Passenger</p>
                <p className="font-bold text-gray-900 text-lg">{passengerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Flight</p>
                <p className="font-bold text-gray-900 text-lg">{boardingPass.flightNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Seat</p>
                <p className="font-bold text-gray-900 text-lg">{boardingPass.seatNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Gate</p>
                <p className="font-bold text-gray-900 text-lg">{boardingPass.gate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Boarding Group</p>
                <p className="font-bold text-gray-900 text-lg">{boardingPass.boardingGroup}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Class</p>
                <p className="font-bold text-gray-900 text-lg">{boardingPass.ticketClass}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Route</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {boardingPass.route.fromCode} → {boardingPass.route.toCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {boardingPass.route.from} → {boardingPass.route.to}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Departure</p>
                  <p className="font-bold text-gray-900 text-lg">{boardingPass.departure}</p>
                  <p className="text-sm text-gray-600">{boardingPass.date}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:ml-6 lg:border-l lg:border-gray-300 lg:pl-6 mt-4 lg:mt-0">
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-2 border">
                <div className="font-mono text-lg font-bold text-gray-900">
                  {boardingPass.barcode}
                </div>
              </div>
              <p className="text-xs text-gray-500 font-semibold">BARCODE</p>
              <p className="text-xs text-gray-400 mt-2">
                Issued: {new Date(boardingPass.issuedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
