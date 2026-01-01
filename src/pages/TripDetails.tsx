import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plane, Users, FileText, Download, Phone, Mail, User, Edit } from "lucide-react";
import { getTripDetails, type TripDetailsData } from "@/api/getTripDetails";
import type { ApiError } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { EditTravellerDialog } from "@/components/EditTravellerDialog";

const TripDetails = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [tripDetails, setTripDetails] = useState<TripDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTraveller, setEditingTraveller] = useState<TripDetailsData["travellers"][0] | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // const [activeTab, setActiveTab] = useState<"ticket" | "documents" | "travellers">("ticket");

  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    const fetchTripDetails = async () => {
      if (!ticketId) {
        setError("Ticket ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getTripDetails(ticketId, abortController.signal);

        if (isCancelled) {
          return;
        }

        if ("success" in response && response.success) {
          setTripDetails(response.data);
        } else {
          const errorResponse = response as ApiError;
          setError(errorResponse.message || "Failed to load trip details");
        }
      } catch (err) {
        if (isCancelled || (err as Error).name === "AbortError") {
          return;
        }
        console.error("Error fetching trip details:", err);
        setError("Failed to load trip details");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchTripDetails();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [ticketId]);

  const formatDate = (dateString: string): string => {
    // Extract date components directly from ISO string without timezone conversion
    const clean = dateString.replace(/Z$/, '');
    const dateMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      const monthNum = parseInt(month, 10) - 1; // JavaScript months are 0-indexed
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[monthNum]} ${parseInt(day, 10)}, ${year}`;
    }
    
    // Fallback to Date parsing if format doesn't match
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    // Extract time components directly from ISO string without timezone conversion
    // Format: "2026-01-20T10:30:00.000Z" -> extract "10:30:00"
    const clean = dateString.replace(/Z$/, '');
    const timeMatch = clean.match(/T(\d{2}):(\d{2}):(\d{2})/);
    
    if (timeMatch) {
      const [, hour, minute] = timeMatch;
      const hourNum = parseInt(hour, 10);
      const minuteNum = parseInt(minute, 10);
      
      // Convert to 12-hour format
      let hour12 = hourNum % 12;
      if (hour12 === 0) hour12 = 12;
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const minuteStr = minuteNum.toString().padStart(2, '0');
      
      return `${hour12}:${minuteStr} ${ampm}`;
    }
    
    // Fallback to Date parsing if format doesn't match
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Plane className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !tripDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Plane className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Trip not found"}
          </h3>
          <p className="text-gray-500">
            {error || "The requested trip could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl -mx-4 sm:-mx-6 lg:-mx-8 -mt-10">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2 px-4 sm:px-6 lg:px-8 pt-2">Trip Details</h1>

      {/* Tabs - COMMENTED OUT (not working) */}
      {/* <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full px-4 sm:px-6 lg:px-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ticket">Ticket</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="travellers">Travellers</TabsTrigger>
        </TabsList>

        {/* Ticket Tab - PNR, Source, Flight Details, Client Details */}
        {/* <TabsContent value="ticket" className="mt-1"> */}

      {/* Content displayed directly without tabs */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Ticket Section - PNR, Source, Flight Details, Client Details */}
        <div className="mt-1">
          <div className="space-y-6">
            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">PNR</label>
                    <p className="mt-1 text-sm text-gray-900">{tripDetails.pnr}</p>
                  </div>
                  {tripDetails.bookingId && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Booking ID</label>
                      <p className="mt-1 text-sm text-gray-900">{tripDetails.bookingId}</p>
                    </div>
                  )}
                  {tripDetails.bookingReference && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Booking Reference</label>
                      <p className="mt-1 text-sm text-gray-900">{tripDetails.bookingReference}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Booking Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {tripDetails.bookingStatus.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {tripDetails.bookingDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Booking Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(tripDetails.bookingDate)}
                      </p>
                    </div>
                  )}
                  {tripDetails.isRefundable !== null && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Refund Status</label>
                      <div className="mt-1">
                        <Badge className={
                          tripDetails.isRefundable 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }>
                          {tripDetails.isRefundable ? 'Refundable' : 'Non-Refundable'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Source</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {tripDetails.source[0]?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flight Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Flight Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tripDetails.flights.map((flight, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Plane className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">{flight.flightNumber}</span>
                        <span className="text-sm text-gray-600">({flight.airlineIata})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Departure</label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {flight.departure.city} ({flight.departure.iata})
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(flight.departure.date)} at {formatTime(flight.departure.date)}
                            </p>
                            <p className="text-xs text-gray-500">{flight.departure.country}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Arrival</label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {flight.arrival.city} ({flight.arrival.iata})
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(flight.arrival.date)} at {formatTime(flight.arrival.date)}
                            </p>
                            <p className="text-xs text-gray-500">{flight.arrival.country}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tripDetails.clients.map((client, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{client.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Type</label>
                          <p className="mt-1 text-sm text-gray-900 capitalize">{client.type}</p>
                        </div>
                        {client.companyName && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Company Name</label>
                            <p className="mt-1 text-sm text-gray-900">{client.companyName}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            Email
                          </label>
                          <p className="mt-1 text-sm text-gray-900">{client.email}</p>
                        </div>
                        {client.phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              Phone
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {client.countryCode ? `${client.countryCode}${client.phone}` : client.phone}
                            </p>
                          </div>
                        )}
                        {client.lastBookingDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Last Booking Date</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(client.lastBookingDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documents Section - Attachments Only */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {tripDetails.attachments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attachments available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tripDetails.attachments.map((attachment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {attachment.url}
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(attachment.url, "_blank")}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>

                      {/* Document Preview */}
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b">
                          <span className="text-xs font-medium text-gray-700">Document Preview</span>
                        </div>
                        <div className="p-2">
                          {attachment.url.toLowerCase().includes(".pdf") ? (
                            <div className="w-full">
                              <iframe
                                src={`${attachment.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-96 border-0 rounded"
                                title={`Document Preview - ${attachment.name}`}
                              />
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-gray-50 rounded">
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-full max-h-96 mx-auto rounded"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Travellers Section - Traveller Details Only */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traveller Details</CardTitle>
            </CardHeader>
            <CardContent>
              {tripDetails.travellers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No travellers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...tripDetails.travellers]
                    .sort((a, b) => {
                      const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
                      const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
                      return nameA.localeCompare(nameB);
                    })
                    .map((traveller, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {traveller.firstname} {traveller.lastname}
                          </h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTraveller(traveller);
                            setIsEditDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {traveller.dateOfBirth && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {traveller.dateOfBirth.includes('T') 
                                ? formatDate(traveller.dateOfBirth)
                                : traveller.dateOfBirth}
                            </p>
                          </div>
                        )}
                        {traveller.gender && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Gender</label>
                            <p className="mt-1 text-sm text-gray-900 capitalize">{traveller.gender}</p>
                          </div>
                        )}
                        {traveller.nationality && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Nationality</label>
                            <p className="mt-1 text-sm text-gray-900">{traveller.nationality}</p>
                          </div>
                        )}
                        {traveller.passport && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Passport</label>
                            <p className="mt-1 text-sm text-gray-900">{traveller.passport}</p>
                          </div>
                        )}
                        {traveller.phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              Phone
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {traveller.countryCode
                                ? `${traveller.countryCode}${traveller.phone}`
                                : traveller.phone}
                            </p>
                          </div>
                        )}
                        {traveller.seat && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Seat</label>
                            <p className="mt-1 text-sm text-gray-900">{traveller.seat}</p>
                          </div>
                        )}
                        {traveller.meal && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Meal Preference</label>
                            <p className="mt-1 text-sm text-gray-900 capitalize">{traveller.meal}</p>
                          </div>
                        )}
                        {traveller.baggage && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Baggage</label>
                            <div className="mt-1 space-y-1">
                              {traveller.baggage.cabin && (
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">Cabin:</span> {traveller.baggage.cabin}
                                </p>
                              )}
                              {traveller.baggage.checkin && (
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">Check-in:</span> {traveller.baggage.checkin}
                                </p>
                              )}
                              {traveller.baggage.additional && (
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">Additional:</span> {traveller.baggage.additional}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* End of commented tabs */}
      {/* </Tabs> */}

      {/* Edit Traveller Dialog */}
      <EditTravellerDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingTraveller(null);
        }}
        onSuccess={() => {
          // Refetch trip details after successful update
          if (ticketId) {
            const fetchTripDetails = async () => {
              try {
                setLoading(true);
                setError(null);
                const response = await getTripDetails(ticketId);
                if ("success" in response && response.success) {
                  setTripDetails(response.data);
                } else {
                  const errorResponse = response as ApiError;
                  setError(errorResponse.message || "Failed to load trip details");
                }
              } catch (err) {
                console.error("Error fetching trip details:", err);
                setError("Failed to load trip details");
              } finally {
                setLoading(false);
              }
            };
            fetchTripDetails();
          }
        }}
        traveller={editingTraveller}
      />
    </div>
  );
};

export default TripDetails;
