import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Plane,
  Users,
  FileText,
  Download,
  User,
  Edit,
  Clock,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import {
  getBookingDetails,
  type BookingDetails,
  type BookingPassenger,
  type BoardingPass,
} from "@/data/flights";
import { countries } from "@/data/countries";
import { getCheckinStatusDisplay } from "@/lib/utils";

import {
  getFlightDataByIds,
  FlightDataByIdsResponse,
  ApiError,
  updateTicket,
} from "@/api";
import {
  WhatsappShareButton,
  TelegramShareButton,
  EmailShareButton,
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappIcon,
  TelegramIcon,
  EmailIcon,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
} from 'react-share';

// Helper function to extract time from ISO string without timezone conversion
const extractTimeFromISO = (isoString: string): string => {
  // Extract time part from ISO string (e.g., "2025-05-16T10:00:00.000Z" -> "10:00")
  const timePart =
    isoString.split("T")[1]?.split(".")[0] ||
    isoString.split("T")[1]?.split("Z")[0];
  if (timePart) {
    const [hours, minutes] = timePart.split(":");
    return `${hours}:${minutes}`;
  }
  return isoString; // fallback to original if parsing fails
};

// Helper function to parse delay string and extract minutes
const parseDelayString = (delayString: string): number | undefined => {
  if (!delayString) return undefined;

  // Extract number from strings like "35m delay", "2h delay", "45 min delay", etc.
  const match = delayString.match(/(\d+)\s*(m|min|h|hour)/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    // Convert to minutes
    if (unit.startsWith("h")) {
      return value * 60;
    } else {
      return value;
    }
  }

  return undefined;
};

// Helper function to determine flight status based on delay and check-in status
const determineFlightStatus = (
  delayString: string,
  checkInStatus: string
): "On Time" | "Delayed" | "Boarding" | "Departed" => {
  if (delayString && delayString.toLowerCase().includes("delay")) {
    return "Delayed";
  }

  switch (checkInStatus) {
    case "FAILED":
      return "Delayed";
    case "COMPLETED":
      return "On Time";
    case "BOARDING":
      return "Boarding";
    default:
      return "On Time";
  }
};

// Helper function to safely format date strings
const formatDateString = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.trim() === "") {
    return "";
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
};

// Helper function to convert API response to BookingDetails format
const convertApiToBookingDetails = (
  apiData: FlightDataByIdsResponse["data"]
): BookingDetails => {
  const passengers: BookingPassenger[] = apiData.passengers.map(
    (passenger, index) => ({
      id: `passenger-${index}`,
      passengerId: passenger.passengerId,
      name: `${passenger.firstName} ${passenger.lastName}`,
      firstName: passenger.firstName, // Add separate firstName field
      lastName: passenger.lastName,   // Add separate lastName field
      email: passenger.email,
      phone: passenger.mobileNumber,
      seatNumber: passenger.seatNumber || "",
      ticketClass: apiData.flightClass,
      status:
        apiData.checkInStatus === "FAILED"
          ? "Pending"
          : ("Checked In" as BookingPassenger["status"]),
      isMainPassenger: index === 0,
      dateOfBirth: passenger.dateOfBirth || "",
      gender: (passenger.gender === "Female" ? "Female" : "Male") as
        | "Male"
        | "Female",
      nationality: passenger.country || "",
      passportNumber: passenger.documents[0]?.number || "",
      passportIssueDate: passenger.documents[0]?.issueDate || "",
      passportExpiry: passenger.documents[0]?.expiry || "",
      passportIssuePlace: passenger.documents[0]?.issueCountry || "",
      countryOfResidence: passenger.country || "",
      hasDocuments: passenger.documents.length > 0,
      specialRequests: [],
      boardingPass: {
        id: `bp-${index}`,
        passengerId: `passenger-${index}`,
        flightId: "api-flight",
        passengerName: `${passenger.firstName} ${passenger.lastName}`,
        flightNumber: apiData.flightNumber,
        date: new Date(apiData.departure.time).toLocaleDateString(),
        departure: extractTimeFromISO(apiData.departure.time),
        arrival: extractTimeFromISO(apiData.arrival.time),
        route: {
          from: apiData.departure.city,
          to: apiData.arrival.city,
          fromCode: apiData.departure.airportIata,
          toCode: apiData.arrival.airportIata,
        },
        seatNumber: passenger.seatNumber || "TBD",
        gate: apiData.boardingGate || "TBD",
        boardingGroup: "A",
        ticketClass: apiData.flightClass,
        barcode:
          `${apiData.flightNumber}${passenger.firstName}${passenger.lastName}`
            .replace(/\s/g, "")
            .toUpperCase(),
        qrCode:
          `QR${apiData.flightNumber}${passenger.firstName}${passenger.lastName}`
            .replace(/\s/g, "")
            .toUpperCase(),
        issuedAt: new Date().toISOString(),
      },
    })
  );

  // Parse delay from API response
  const delayMinutes = parseDelayString(apiData.delay);
  const flightStatus = determineFlightStatus(
    apiData.delay,
    apiData.checkInStatus
  );

  return {
    pnr: apiData.pnr,
    bookingReference: apiData.bookingReference || "",
    flight: {
      id: apiData.flightNumber,
      flightNumber: apiData.flightNumber,
      route: {
        from: apiData.departure.city,
        to: apiData.arrival.city,
        fromCode: apiData.departure.airportIata,
        toCode: apiData.arrival.airportIata,
      },
      departure: extractTimeFromISO(apiData.departure.time),
      arrival: extractTimeFromISO(apiData.arrival.time),
      checkInStatus: apiData.checkInStatus,
      checkInSubStatus: apiData.checkInSubStatus,
      aircraft: apiData.aircraftType,
      gate: apiData.boardingGate || "TBD",
      status: flightStatus,
      flightType: apiData.isInternational ? "International" : "Domestic",
      webCheckinStatus:
        apiData.checkInStatus === "FAILED" ? "Failed" : "Completed",
      delay: delayMinutes,
      passengers: passengers.length,
    },
    passengers,
    totalPassengers: passengers.length,
    checkedInPassengers: passengers.filter((p) => p.status === "Checked In")
      .length,
    boardedPassengers: passengers.filter((p) => p.status === "Boarded").length,
    pendingPassengers: passengers.filter((p) => p.status === "Pending").length,
    bookingDate: new Date().toISOString(),
    bookingStatus: "Confirmed" as const,
    totalAmount: 0,
    currency: "USD",
    contactEmail: passengers[0]?.email || "",
    contactPhone: passengers[0]?.phone || "",
    ticketDocuments: apiData.ticketDocumets || [], // Note: keeping the typo from API
  };
};

// Always editable field component
interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "date";
  className?: string;
  isRequired?: boolean;
  showGreyWhenEmpty?: boolean; // New prop for booking reference
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  isRequired = false,
  showGreyWhenEmpty = false,
}) => {
  const isEmpty = isRequired && (!value || value.trim() === "");
  const shouldShowRed = isEmpty && !showGreyWhenEmpty;

  if (type === "date") {
    const dateValue = value ? new Date(value) : undefined;
    const isValidDate = dateValue && !isNaN(dateValue.getTime());

    return (
      <div className={className}>
        <Input
          type="date"
          value={isValidDate ? dateValue.toISOString().split("T")[0] : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select date"
          required={isRequired}
          className="mt-1"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 h-9 text-sm ${
          shouldShowRed
            ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500"
            : isEmpty && showGreyWhenEmpty
            ? "border-gray-400 border-2 focus:border-gray-400 focus:ring-gray-400"
            : ""
        }`}
      />
    </div>
  );
};

// Gender selector component
interface GenderSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isRequired?: boolean;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({
  label,
  value,
  onChange,
  className = "",
  isRequired = false,
}) => {
  const isEmpty = isRequired && (!value || value.trim() === "");

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`mt-1 h-9 text-sm ${
            isEmpty
              ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
        >
          <SelectValue placeholder="Select Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Male">Male</SelectItem>
          <SelectItem value="Female">Female</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

// Read-only field component
interface ReadOnlyFieldProps {
  label: string;
  value: string;
  className?: string;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({
  label,
  value,
  className = "",
}) => {
  const hasValue = value && value.trim() !== "";

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className={`mt-1 px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm ${
        hasValue ? 'text-gray-900' : 'text-gray-400'
      }`}>
        {hasValue ? value : 'No data'}
      </div>
    </div>
  );
};

// Country selector component for nationality
interface NationalitySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isRequired?: boolean;
}

const NationalitySelector: React.FC<NationalitySelectorProps> = ({
  label,
  value,
  onChange,
  className = "",
  isRequired = false,
}) => {
  const isEmpty = isRequired && (!value || value.trim() === "");

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`mt-1 h-9 text-sm ${
            isEmpty
              ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
        >
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Country selector component for issue place
interface CountrySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isRequired?: boolean;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  label,
  value,
  onChange,
  className = "",
  isRequired = false,
}) => {
  const isEmpty = isRequired && (!value || value.trim() === "");

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`mt-1 h-9 text-sm ${
            isEmpty
              ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
        >
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const TripDetails = () => {
  const { flightId, ticketId } = useParams<{
    flightId: string;
    ticketId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<
    FlightDataByIdsResponse["data"] | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pnrCopied, setPnrCopied] = useState(false);

  // State for tracking section changes and saving status
  const [sectionChanges, setSectionChanges] = useState<{
    booking: boolean;
    flight: boolean;
    passengers: { [key: number]: boolean };
  }>({
    booking: false,
    flight: false,
    passengers: {},
  });

  const [sectionSaving, setSectionSaving] = useState<{
    booking: boolean;
    flight: boolean;
    passengers: { [key: number]: boolean };
  }>({
    booking: false,
    flight: false,
    passengers: {},
  });

  // Mobile detection - improved to detect mobile devices more accurately
  useEffect(() => {
    const checkMobile = () => {
      // Check for mobile devices using multiple methods
      const isMobileWidth = window.innerWidth < 768;
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Consider it mobile if any of these conditions are true
      setIsMobile(isMobileWidth || isMobileUserAgent || isTouchDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchFlightDetails = async () => {
      if (!flightId) return;

      try {
        setLoading(true);
        setError(null);

        // Get ticketId from URL params or search params (fallback)
        const finalTicketId = ticketId || searchParams.get("ticketId");

        if (finalTicketId) {
          // Try to fetch from API first
          const response = await getFlightDataByIds(flightId, finalTicketId);

          if ("success" in response && response.success) {
            const apiResponse = response as FlightDataByIdsResponse;

            // Store API data for reference
            setApiData(apiResponse.data);

            // Convert API data to BookingDetails format
            const convertedBookingDetails = convertApiToBookingDetails(
              apiResponse.data
            );
            setBookingDetails(convertedBookingDetails);
          } else {
            const errorResponse = response as ApiError;
            setError(errorResponse.message);
            // Fallback to mock data
            const details = getBookingDetails(flightId);
            setBookingDetails(details);
          }
        } else {
          // No ticketId, use mock data
          const details = getBookingDetails(flightId);
          setBookingDetails(details);
        }
      } catch (err) {
        console.error("Error fetching flight details:", err);
        setError("Failed to load flight details");
        // Fallback to mock data
        const details = getBookingDetails(flightId);
        setBookingDetails(details);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightDetails();
  }, [flightId, ticketId, searchParams]);

  const handleFieldChange = (
    section: string,
    field: string,
    value: string,
    passengerIndex?: number
  ) => {
    if (!bookingDetails) return;

    const updatedBooking = { ...bookingDetails };

    if (section === "booking") {
      (updatedBooking as any)[field] = value;
      setSectionChanges((prev) => ({ ...prev, booking: true }));
    } else if (section === "flight") {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        (updatedBooking.flight as any)[parent][child] = value;
      } else {
        (updatedBooking.flight as any)[field] = value;
      }
      setSectionChanges((prev) => ({ ...prev, flight: true }));
    } else if (section === "passenger" && passengerIndex !== undefined) {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        (updatedBooking.passengers[passengerIndex] as any)[parent][child] =
          value;
      } else {
        (updatedBooking.passengers[passengerIndex] as any)[field] = value;
      }
      setSectionChanges((prev) => ({
        ...prev,
        passengers: { ...prev.passengers, [passengerIndex]: true },
      }));
    }

    setBookingDetails(updatedBooking);
    console.log("Field updated:", section, field, value);
  };

  const handleSectionSave = async (
    section: "booking" | "flight" | "passenger",
    passengerIndex?: number
  ) => {
    if (!bookingDetails) return;

    if (section === "passenger" && passengerIndex !== undefined) {
      setSectionSaving((prev) => ({
        ...prev,
        passengers: { ...prev.passengers, [passengerIndex]: true },
      }));
    } else {
      setSectionSaving((prev) => ({ ...prev, [section]: true }));
    }

    try {
      if (section === "booking") {
        // Get ticketId from URL params or search params
        const finalTicketId = ticketId || searchParams.get("ticketId");

        if (finalTicketId) {
          const result = await updateTicket(
            parseInt(finalTicketId),
            bookingDetails.pnr,
            bookingDetails.bookingReference
          );

          if ("success" in result && result.success) {
            console.log("Booking details updated successfully:", result);
          } else {
            throw new Error(
              result.message || "Failed to update booking details"
            );
          }
        } else {
          // Fallback for cases without ticketId - just simulate
          await new Promise((resolve) => setTimeout(resolve, 800));
          console.log("Saving booking section (no ticketId):", {
            pnr: bookingDetails.pnr,
            bookingReference: bookingDetails.bookingReference,
            contactEmail: bookingDetails.contactEmail,
            contactPhone: bookingDetails.contactPhone,
          });
        }
      } else {
        // For other sections, simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.log(
          `Saving ${section} section:`,
          section === "passenger" && passengerIndex !== undefined
            ? bookingDetails.passengers[passengerIndex]
            : bookingDetails.flight
        );
      }

      // Clear section-specific changes
      if (section === "passenger" && passengerIndex !== undefined) {
        setSectionChanges((prev) => ({
          ...prev,
          passengers: { ...prev.passengers, [passengerIndex]: false },
        }));
      } else {
        setSectionChanges((prev) => ({ ...prev, [section]: false }));
      }
    } catch (error) {
      console.error(`Error saving ${section} section:`, error);
      setError(`Failed to save ${section} changes. Please try again.`);
    } finally {
      if (section === "passenger" && passengerIndex !== undefined) {
        setSectionSaving((prev) => ({
          ...prev,
          passengers: { ...prev.passengers, [passengerIndex]: false },
        }));
      } else {
        setSectionSaving((prev) => ({ ...prev, [section]: false }));
      }
    }
  };

  const handleCopyPNR = async () => {
    try {
      await navigator.clipboard.writeText(pnr);
      setPnrCopied(true);
      setTimeout(() => setPnrCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PNR:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pnr;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setPnrCopied(true);
        setTimeout(() => setPnrCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownloadTicketDocument = (url: string, name: string) => {
    // Open the ticket document in a new tab
    window.open(url, '_blank');
  };

  // Share Button Component using react-share
  const ShareButton = ({ url, title }: { url: string; title: string }) => {
    const [showShareOptions, setShowShareOptions] = useState(false);
    const shareUrl = url;
    const shareTitle = `Check out this document: ${title}`;

    // Close share options when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (showShareOptions && !target.closest('.share-dropdown')) {
          setShowShareOptions(false);
        }
      };

      if (showShareOptions) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showShareOptions]);

    return (
      <div className="relative share-dropdown">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowShareOptions(!showShareOptions)}
          className="flex items-center space-x-2"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>

        {showShareOptions && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
            <div className="grid grid-cols-3 gap-2">
              <WhatsappShareButton
                url={shareUrl}
                title={shareTitle}
                onClick={() => setShowShareOptions(false)}
              >
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>

              <TelegramShareButton
                url={shareUrl}
                title={shareTitle}
                onClick={() => setShowShareOptions(false)}
              >
                <TelegramIcon size={32} round />
              </TelegramShareButton>

              <EmailShareButton
                url={shareUrl}
                subject={shareTitle}
                onClick={() => setShowShareOptions(false)}
              >
                <EmailIcon size={32} round />
              </EmailShareButton>

              <FacebookShareButton
                url={shareUrl}
                onClick={() => setShowShareOptions(false)}
              >
                <FacebookIcon size={32} round />
              </FacebookShareButton>

              <TwitterShareButton
                url={shareUrl}
                title={shareTitle}
                onClick={() => setShowShareOptions(false)}
              >
                <TwitterIcon size={32} round />
              </TwitterShareButton>

              <LinkedinShareButton
                url={shareUrl}
                title={shareTitle}
                onClick={() => setShowShareOptions(false)}
              >
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert('Link copied to clipboard!');
                  setShowShareOptions(false);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };



  const handleDownloadBoardingPass = (boardingPass: BoardingPass) => {
    // Create a comprehensive HTML boarding pass
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boarding Pass - ${boardingPass.flightNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        .boarding-pass {
            background: white;
            border: 2px dashed #2563eb;
            border-radius: 12px;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            position: relative;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        .airline-logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .boarding-pass-title {
            font-size: 24px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
        }
        .flight-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .info-title {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 5px;
        }
        .route-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            border-radius: 12px;
        }
        .route-cities {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .route-codes {
            font-size: 16px;
            opacity: 0.9;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-item {
            text-align: center;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .barcode-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px dashed #d1d5db;
        }
        .barcode {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            background: #111827;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { background: white; padding: 0; }
            .boarding-pass { box-shadow: none; border: 2px solid #333; }
        }
        @media (max-width: 768px) {
            .flight-info { grid-template-columns: 1fr; gap: 15px; }
            .details-grid { grid-template-columns: 1fr 1fr; }
            .route-cities { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="boarding-pass">
        <div class="header">
            <div class="airline-logo">✈ AIRLINE</div>
            <div class="boarding-pass-title">BOARDING PASS</div>
        </div>

        <div class="flight-info">
            <div class="info-section">
                <div class="info-title">Passenger Name</div>
                <div class="info-value">${boardingPass.passengerName}</div>
                <div class="info-title">Flight Number</div>
                <div class="info-value">${boardingPass.flightNumber}</div>
            </div>
            <div class="info-section">
                <div class="info-title">Date</div>
                <div class="info-value">${boardingPass.date}</div>
                <div class="info-title">Departure Time</div>
                <div class="info-value">${boardingPass.departure}</div>
            </div>
        </div>

        <div class="route-section">
            <div class="route-cities">${boardingPass.route.from} → ${
      boardingPass.route.to
    }</div>
            <div class="route-codes">${boardingPass.route.fromCode} → ${
      boardingPass.route.toCode
    }</div>
        </div>

        <div class="details-grid">
            <div class="detail-item">
                <div class="info-title">Seat</div>
                <div class="info-value">${boardingPass.seatNumber}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Gate</div>
                <div class="info-value">${boardingPass.gate}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Boarding Group</div>
                <div class="info-value">${boardingPass.boardingGroup}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Class</div>
                <div class="info-value">${boardingPass.ticketClass}</div>
            </div>
        </div>

        <div class="barcode-section">
            <div class="barcode">${boardingPass.barcode}</div>
            <div style="color: #6b7280; font-size: 12px;">Scan at gate for boarding</div>
        </div>

        <div class="footer">
            <p>Please arrive at the gate 30 minutes before departure</p>
            <p>Issued: ${new Date(boardingPass.issuedAt).toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boarding-pass-${
      boardingPass.flightNumber
    }-${boardingPass.passengerName.replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintBoardingPass = (boardingPass: BoardingPass) => {
    // Create the same HTML content for printing
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boarding Pass - ${boardingPass.flightNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 20px;
            color: #333;
        }
        .boarding-pass {
            background: white;
            border: 2px solid #333;
            border-radius: 12px;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .airline-logo {
            font-size: 32px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
        }
        .boarding-pass-title {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        .flight-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8f8f8;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #000;
        }
        .info-title {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        .route-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #000;
            color: white;
            border-radius: 12px;
        }
        .route-cities {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .route-codes {
            font-size: 16px;
            opacity: 0.9;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-item {
            text-align: center;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .barcode-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px dashed #333;
        }
        .barcode {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            background: #000;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { padding: 0; }
            .boarding-pass { border: 2px solid #000; }
        }
    </style>
</head>
<body>
    <div class="boarding-pass">
        <div class="header">
            <div class="airline-logo">✈ AIRLINE</div>
            <div class="boarding-pass-title">BOARDING PASS</div>
        </div>

        <div class="flight-info">
            <div class="info-section">
                <div class="info-title">Passenger Name</div>
                <div class="info-value">${boardingPass.passengerName}</div>
                <div class="info-title">Flight Number</div>
                <div class="info-value">${boardingPass.flightNumber}</div>
            </div>
            <div class="info-section">
                <div class="info-title">Date</div>
                <div class="info-value">${boardingPass.date}</div>
                <div class="info-title">Departure Time</div>
                <div class="info-value">${boardingPass.departure}</div>
            </div>
        </div>

        <div class="route-section">
            <div class="route-cities">${boardingPass.route.from} → ${
      boardingPass.route.to
    }</div>
            <div class="route-codes">${boardingPass.route.fromCode} → ${
      boardingPass.route.toCode
    }</div>
        </div>

        <div class="details-grid">
            <div class="detail-item">
                <div class="info-title">Seat</div>
                <div class="info-value">${boardingPass.seatNumber}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Gate</div>
                <div class="info-value">${boardingPass.gate}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Boarding Group</div>
                <div class="info-value">${boardingPass.boardingGroup}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Class</div>
                <div class="info-value">${boardingPass.ticketClass}</div>
            </div>
        </div>

        <div class="barcode-section">
            <div class="barcode">${boardingPass.barcode}</div>
            <div style="color: #666; font-size: 12px;">Scan at gate for boarding</div>
        </div>

        <div class="footer">
            <p>Please arrive at the gate 30 minutes before departure</p>
            <p>Issued: ${new Date(boardingPass.issuedAt).toLocaleString()}</p>
        </div>
    </div>
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            }
        }
    </script>
</body>
</html>
    `.trim();

    // Open in new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handleDownloadTextBoardingPass = (boardingPass: BoardingPass) => {
    // Create a simple text representation of the boarding pass
    const content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                BOARDING PASS                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  PASSENGER: ${boardingPass.passengerName.padEnd(
      25
    )} FLIGHT: ${boardingPass.flightNumber.padEnd(10)}        ║
║                                                                              ║
║  FROM: ${boardingPass.route.fromCode.padEnd(
      3
    )} ${boardingPass.route.from.padEnd(
      20
    )} TO: ${boardingPass.route.toCode.padEnd(
      3
    )} ${boardingPass.route.to.padEnd(15)} ║
║                                                                              ║
║  DATE: ${boardingPass.date.padEnd(
      12
    )} DEPARTURE: ${boardingPass.departure.padEnd(
      8
    )} SEAT: ${boardingPass.seatNumber.padEnd(4)}     ║
║                                                                              ║
║  GATE: ${boardingPass.gate.padEnd(
      4
    )} BOARDING GROUP: ${boardingPass.boardingGroup.padEnd(
      8
    )} CLASS: ${boardingPass.ticketClass.padEnd(12)} ║
║                                                                              ║
║  ${boardingPass.barcode.padEnd(70)} ║
║                                                                              ║
║  Please arrive at gate 30 minutes before departure                          ║
║  Issued: ${new Date(boardingPass.issuedAt)
      .toLocaleString()
      .padEnd(50)}                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boarding-pass-${
      boardingPass.flightNumber
    }-${boardingPass.passengerName.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: BookingPassenger["status"]) => {
    switch (status) {
      case "Boarded":
        return "bg-green-100 text-green-800";
      case "Checked In":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFlightStatusColor = (status: string) => {
    switch (status) {
      case "On Time":
        return "bg-green-100 text-green-800";
      case "Delayed":
        return "bg-red-100 text-red-800";
      case "Boarding":
        return "bg-blue-100 text-blue-800";
      case "Departed":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Use the centralized utility function for check-in status
  const getCheckinStatusInfo = (status: string, subStatus?: string) => {
    return getCheckinStatusDisplay(status, subStatus);
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

  if (!bookingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Plane className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Booking not found
          </h3>
          <p className="text-gray-500 mb-4">
            The requested booking could not be found.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }

  const {
    pnr,
    bookingReference,
    flight,
    passengers,
    totalPassengers,
    contactEmail,
    contactPhone,
  } = bookingDetails;

  // Check if boarding passes are available
  const hasBoardingPasses = passengers.some(p => p.boardingPass) || bookingDetails.ticketDocuments?.length;
  const defaultAccordionValue = hasBoardingPasses ? "documents" : "booking-info";

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error}. Showing fallback data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        {/* Back button and save button row */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Trips</span>
          </Button>
        </div>

        {/* Header content - Mobile responsive layout */}
        <div className="space-y-6">
          {/* Flight title and route */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {flight.route.from} ({flight.route.fromCode}) → {flight.route.to} ({flight.route.toCode})
            </h1>

            {/* Flight timing card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
              {/* Flight number and date header */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Plane className="h-4 w-4" />
                    <span className="font-semibold">Flight {flight.flightNumber}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{(() => {
                      const dateStr = passengers[0]?.boardingPass?.date;
                      if (dateStr) {
                        // If date is already in DD/MM/YYYY format, use it
                        if (dateStr.includes('/') && dateStr.split('/').length === 3) {
                          return dateStr;
                        }
                        // Otherwise, parse and format to DD/MM/YYYY
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                          const day = date.getDate().toString().padStart(2, '0');
                          const month = (date.getMonth() + 1).toString().padStart(2, '0');
                          const year = date.getFullYear();
                          return `${day}/${month}/${year}`;
                        }
                      }
                      // Fallback to current date in DD/MM/YYYY format
                      const today = new Date();
                      const day = today.getDate().toString().padStart(2, '0');
                      const month = (today.getMonth() + 1).toString().padStart(2, '0');
                      const year = today.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Departure</div>
                  <div className="text-lg font-bold text-gray-900">{flight.departure}</div>
                  <div className="text-sm text-gray-600">{flight.route.fromCode}</div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-8 h-px bg-blue-300"></div>
                    <Plane className="h-4 w-4" />
                    <div className="w-8 h-px bg-blue-300"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Arrival</div>
                  <div className="text-lg font-bold text-gray-900">{flight.arrival}</div>
                  <div className="text-sm text-gray-600">{flight.route.toCode}</div>
                </div>
              </div>
            </div>

            {/* Flight details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
                <span>PNR: <span className="font-semibold text-gray-900">{pnr}</span></span>
                <button
                  onClick={handleCopyPNR}
                  className="ml-1 p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy PNR"
                >
                  {pnrCopied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-500" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{totalPassengers} passenger{totalPassengers !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Status badge and download button - Mobile responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {(() => {
              const statusInfo = getCheckinStatusInfo(flight.checkInStatus, flight.checkInSubStatus);
              return (
                <Badge
                  className={`${statusInfo.colorClass} text-xs sm:text-sm w-fit`}
                  variant="outline"
                >
                  <span className="hidden sm:inline">Web Check-in: </span>
                  <span className="sm:hidden">Check-in: </span>
                  {statusInfo.displayStatus}
                </Badge>
              );
            })()}

          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultAccordionValue}
        className="w-full space-y-4"
      >
        {/* Booking Information */}
        <AccordionItem value="booking-info">
          <AccordionTrigger className="text-left py-4 sm:py-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm sm:text-base">Booking Information</span>
              {sectionChanges.booking && (
                <div className="w-2 h-2 bg-orange-500 rounded-full ml-2"></div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <EditableField
                  label="PNR Code"
                  value={pnr}
                  onChange={(value) =>
                    handleFieldChange("booking", "pnr", value)
                  }
                  isRequired={true}
                  className="text-sm"
                />
                <EditableField
                  label="Booking Reference"
                  value={bookingReference}
                  onChange={(value) =>
                    handleFieldChange("booking", "bookingReference", value)
                  }
                  isRequired={false}
                  showGreyWhenEmpty={true}
                  className="text-sm"
                />
                <EditableField
                  label="Contact Email"
                  value={contactEmail}
                  onChange={(value) =>
                    handleFieldChange("booking", "contactEmail", value)
                  }
                  type="email"
                  isRequired={false}
                  className="text-sm"
                />
                <EditableField
                  label="Contact Phone"
                  value={contactPhone}
                  onChange={(value) =>
                    handleFieldChange("booking", "contactPhone", value)
                  }
                  type="tel"
                  isRequired={false}
                  className="text-sm"
                />
              </div>
              {sectionChanges.booking && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleSectionSave("booking")}
                    disabled={sectionSaving.booking}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {sectionSaving.booking ? "Saving..." : "Save Booking Info"}
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Passenger Details */}
        <AccordionItem value="passengers">
          <AccordionTrigger className="text-left py-4 sm:py-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="text-sm sm:text-base">Passenger Details ({totalPassengers} passengers)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 sm:space-y-6 pt-4">
              {passengers.map((passenger, index) => (
                <Card
                  key={passenger.id}
                  className={`border-l-4 ${
                    passenger.isMainPassenger
                      ? "border-l-blue-500 bg-blue-50/30"
                      : "border-l-gray-300"
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    {/* Header with name, status, and boarding pass button */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-6 w-6 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              <button
                                onClick={() => {
                                  if (passenger.passengerId) {
                                    const passengerUrl = `/passengers/P${passenger.passengerId}`;
                                    window.open(passengerUrl, '_blank');
                                  }
                                }}
                                className={`transition-colors duration-200 ${
                                  passenger.passengerId
                                    ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                                    : 'text-gray-900 cursor-default'
                                }`}
                                title={passenger.passengerId ? "Click to view passenger details in new tab" : "Passenger details not available"}
                                disabled={!passenger.passengerId}
                              >
                                {passenger.name}
                              </button>
                            </h3>
                            {passenger.isMainPassenger && (
                              <Badge variant="secondary" className="text-xs">
                                Main Passenger
                              </Badge>
                            )}
                            {sectionChanges.passengers[index] && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {passenger.seatNumber
                              ? `Seat ${passenger.seatNumber}`
                              : "Seat not assigned"}{" "}
                            • {passenger.ticketClass}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                        {passenger.passengerId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/passengers/P${passenger.passengerId}`)
                            }
                            className="flex items-center space-x-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit Details</span>
                          </Button>
                        )}

                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-1">
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <ReadOnlyField
                          label="First Name"
                          value={passenger.firstName || ""}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Last Name"
                          value={passenger.lastName || ""}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Date of Birth"
                          value={formatDateString(passenger.dateOfBirth)}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Gender"
                          value={passenger.gender}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Country"
                          value={passenger.nationality}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Seat Number"
                          value={passenger.seatNumber || ""}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Passport Details - Full Width */}
                    <div className="space-y-4 w-full">
                      <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                        Passport Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ReadOnlyField
                          label="Passport Number"
                          value={passenger.passportNumber}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Issue Date"
                          value={formatDateString(passenger.passportIssueDate)}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Expiry Date"
                          value={formatDateString(passenger.passportExpiry)}
                          className="text-sm"
                        />
                        <ReadOnlyField
                          label="Issue Country"
                          value={passenger.passportIssuePlace}
                          className="text-sm"
                        />
                      </div>
                      {!passenger.hasDocuments && (
                        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded-lg mt-3">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            Passport documents required
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Special Requests */}
                    {passenger.specialRequests &&
                      passenger.specialRequests.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Special Requests
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {passenger.specialRequests.map((request, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {request}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Documents */}
        {bookingDetails.ticketDocuments?.length && (
          <AccordionItem value="documents">
            <AccordionTrigger className="text-left">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documents ({bookingDetails.ticketDocuments.length} available)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {/* Show ticket documents (official boarding passes) */}
                {bookingDetails.ticketDocuments?.map((document, index) => (
                  <Card key={`ticket-${index}`} className="border-l-4 border-l-blue-500 bg-blue-50/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {document.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Flight {flight.flightNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                          <Badge className="bg-blue-100 text-blue-800" variant="outline">
                            Document
                          </Badge>
                        </div>
                      </div>

                      {/* PDF Preview */}
                      <div className="bg-white border rounded-lg mb-4 overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Document Preview</span>
                        </div>
                        <div className="p-2">
                          {document.url.toLowerCase().includes('.pdf') ? (
                            <div className="w-full">
                              <iframe
                                src={`${document.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-48 border-0 rounded"
                                title={`Document Preview - ${document.name}`}
                                onError={(e) => {
                                  console.error('PDF preview failed:', e);
                                  // Fallback to link if iframe fails
                                  const iframe = e.target as HTMLIFrameElement;
                                  iframe.style.display = 'none';
                                  const fallback = iframe.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'block';
                                }}
                              />
                              <div className="hidden text-center py-4 bg-gray-50 rounded">
                                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600 mb-2 text-sm">PDF preview not available</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-gray-50 rounded">
                              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600 mb-2 text-sm">Document preview not available</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDownloadTicketDocument(document.url, document.name)}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </Button>

                        {(isMobile || 'share' in navigator) && (
                          <ShareButton url={document.url} title={document.name} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export default TripDetails;
