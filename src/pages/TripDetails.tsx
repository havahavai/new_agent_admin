import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plane, Users, FileText, Download, Phone, Mail, User } from "lucide-react";
import { getTripDetails, type TripDetailsData } from "@/api/getTripDetails";
import type { ApiError } from "@/api/types";

const TripDetails = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [tripDetails, setTripDetails] = useState<TripDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
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
            {/* PNR and Source */}
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
                  {tripDetails.travellers.map((traveller, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {traveller.firstname} {traveller.lastname}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {traveller.dateOfBirth && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(traveller.dateOfBirth)}</p>
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
    </div>
  );
};

export default TripDetails;
