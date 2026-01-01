import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { countries } from "@/data/countries";
import { getCountryCallingCode, getCountries } from "react-phone-number-input";
import { updateTraveller, UpdateTravellerRequest } from "@/api/updateTraveller";
import type { TripDetailsData } from "@/api/getTripDetails";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTravellerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  traveller: TripDetailsData["travellers"][0] | null;
}

export const EditTravellerDialog: React.FC<EditTravellerDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  traveller,
}) => {
  const [formData, setFormData] = useState({
    passportNumber: "",
    nationality: "",
    countryCode: "",
    phone: "",
    seat: "",
    meal: "",
    gender: "",
    baggage: {
      cabin: "",
      checkin: "",
      additional: "",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [isNationalityOpen, setIsNationalityOpen] = useState(false);

  // Get country codes from react-phone-number-input
  const countryCodes = getCountries().map((country) => ({
    code: country,
    callingCode: getCountryCallingCode(country),
  }));

  // Filter countries for nationality dropdown
  const filteredCountries = countries.filter((country) =>
    nationalitySearch
      ? country.name.toLowerCase().includes(nationalitySearch.toLowerCase()) ||
        country.nationality.toLowerCase().includes(nationalitySearch.toLowerCase()) ||
        country.code.toLowerCase().includes(nationalitySearch.toLowerCase())
      : true
  );

  // Initialize form data when traveller changes
  useEffect(() => {
    if (traveller && isOpen) {
      // Extract country code from phone if it exists
      let countryCode = traveller.countryCode || "";
      let phoneNumber = traveller.phone || "";

      // If countryCode is in format like "+91", extract just the number
      if (countryCode && countryCode.startsWith("+")) {
        countryCode = countryCode.substring(1);
      }

      // If phone includes country code, separate them
      if (phoneNumber && phoneNumber.startsWith("+")) {
        const match = phoneNumber.match(/^\+(\d{1,3})(.*)$/);
        if (match) {
          countryCode = match[1];
          phoneNumber = match[2];
        }
      }

      // If no country code, default to 91 (India)
      if (!countryCode) {
        countryCode = "91";
      }

      setFormData({
        passportNumber: traveller.passport || "",
        nationality: traveller.nationality || "",
        countryCode: countryCode,
        phone: phoneNumber,
        seat: traveller.seat || "",
        meal: traveller.meal || "",
        gender: traveller.gender || "",
        baggage: {
          cabin: traveller.baggage?.cabin || "",
          checkin: traveller.baggage?.checkin || "",
          additional: traveller.baggage?.additional || "",
        },
      });
      setErrors({});
      setNationalitySearch("");
    }
  }, [traveller, isOpen]);

  const validatePassport = (passport: string): string | null => {
    if (!passport.trim()) {
      return null; // Optional field
    }
    // Passport validation: alphanumeric, 6-9 characters typically
    const passportRegex = /^[A-Z0-9]{6,9}$/i;
    if (!passportRegex.test(passport.trim())) {
      return "Passport number must be 6-9 alphanumeric characters";
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
      return null; // Optional field
    }
    // Phone validation: digits only, 7-15 digits
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return "Phone number must be 7-15 digits";
    }
    return null;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("baggage.")) {
      const baggageField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        baggage: {
          ...prev.baggage,
          [baggageField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    if (field === "passportNumber") {
      const error = validatePassport(formData.passportNumber);
      if (error) {
        setErrors((prev) => ({ ...prev, passportNumber: error }));
      }
    } else if (field === "phone") {
      const error = validatePhone(formData.phone);
      if (error) {
        setErrors((prev) => ({ ...prev, phone: error }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields
    const newErrors: Record<string, string> = {};

    const passportError = validatePassport(formData.passportNumber);
    if (passportError) {
      newErrors.passportNumber = passportError;
    }

    const phoneError = validatePhone(formData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!traveller) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build updates object - only include fields that have values
      const updates: UpdateTravellerRequest["updates"] = {};

      if (formData.passportNumber.trim()) {
        updates.passportNumber = formData.passportNumber.trim();
      }

      if (formData.nationality) {
        updates.nationality = formData.nationality;
      }

      // Format country code with + prefix (always include, default to +91 if not set)
      const countryCodeValue = formData.countryCode || "91";
      updates.countryCode = `+${countryCodeValue}`;

      if (formData.phone.trim()) {
        updates.phone = formData.phone.trim();
      }

      if (formData.seat.trim()) {
        updates.seat = formData.seat.trim();
      }

      if (formData.meal.trim()) {
        updates.meal = formData.meal.trim();
      }

      if (formData.gender) {
        updates.gender = formData.gender;
      }

      // Add baggage if any field has value
      if (
        formData.baggage.cabin.trim() ||
        formData.baggage.checkin.trim() ||
        formData.baggage.additional.trim()
      ) {
        updates.baggage = {};
        if (formData.baggage.cabin.trim()) {
          updates.baggage.cabin = formData.baggage.cabin.trim();
        }
        if (formData.baggage.checkin.trim()) {
          updates.baggage.checkin = formData.baggage.checkin.trim();
        }
        if (formData.baggage.additional.trim()) {
          updates.baggage.additional = formData.baggage.additional.trim();
        }
      }

      const response = await updateTraveller({
        travellerId: traveller.travellerId,
        updates,
      });

      if ("success" in response && response.success) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        const errorResponse = response as ApiError;
        setErrors({ submit: errorResponse.message || "Failed to update traveller" });
      }
    } catch (error) {
      console.error("Error updating traveller:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to update traveller",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!traveller) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] w-[calc(100%-2rem)] sm:w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Traveller Details</DialogTitle>
          <DialogDescription>
            Update traveller information for {traveller.firstname} {traveller.lastname}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Passport Number */}
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={formData.passportNumber}
                onChange={(e) => handleInputChange("passportNumber", e.target.value)}
                onBlur={() => handleBlur("passportNumber")}
                placeholder="Enter passport number"
                className={errors.passportNumber ? "border-red-500" : ""}
              />
              {errors.passportNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.passportNumber}</p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Popover open={isNationalityOpen} onOpenChange={setIsNationalityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-10"
                    type="button"
                  >
                    {formData.nationality
                      ? (() => {
                          const country = countries.find((c) => c.code === formData.nationality);
                          return country ? `${country.code} - ${country.nationality}` : formData.nationality;
                        })()
                      : "Select Nationality"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b sticky top-0 bg-white z-10">
                    <Input
                      placeholder="Search nationality..."
                      value={nationalitySearch}
                      onChange={(e) => setNationalitySearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto overscroll-contain">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            handleInputChange("nationality", country.code);
                            setNationalitySearch("");
                            setIsNationalityOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer transition-colors",
                            formData.nationality === country.code && "bg-gray-100"
                          )}
                        >
                          <span>
                            {country.code} - {country.nationality}
                          </span>
                          {formData.nationality === country.code && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        No countries found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Country Code and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="countryCode">Country Code</Label>
                <Select
                  value={formData.countryCode || "91"}
                  onValueChange={(value) => handleInputChange("countryCode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Country Code">
                      {formData.countryCode ? `+${formData.countryCode}` : "+91"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {countryCodes.map((cc) => (
                      <SelectItem key={cc.code} value={cc.callingCode}>
                        +{cc.callingCode} ({cc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="Enter phone number"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Seat and Meal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seat">Seat</Label>
                <Input
                  id="seat"
                  value={formData.seat}
                  onChange={(e) => handleInputChange("seat", e.target.value)}
                  placeholder="e.g., 12A"
                />
              </div>
              <div>
                <Label htmlFor="meal">Meal Preference</Label>
                <Input
                  id="meal"
                  value={formData.meal}
                  onChange={(e) => handleInputChange("meal", e.target.value)}
                  placeholder="e.g., Vegetarian"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Baggage */}
            <div className="space-y-2">
              <Label>Baggage</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="baggage-cabin" className="text-xs text-gray-600">
                    Cabin
                  </Label>
                  <Input
                    id="baggage-cabin"
                    value={formData.baggage.cabin}
                    onChange={(e) =>
                      handleInputChange("baggage.cabin", e.target.value)
                    }
                    placeholder="e.g., 7 kg"
                  />
                </div>
                <div>
                  <Label htmlFor="baggage-checkin" className="text-xs text-gray-600">
                    Check-in
                  </Label>
                  <Input
                    id="baggage-checkin"
                    value={formData.baggage.checkin}
                    onChange={(e) =>
                      handleInputChange("baggage.checkin", e.target.value)
                    }
                    placeholder="e.g., 25 kg"
                  />
                </div>
                <div>
                  <Label htmlFor="baggage-additional" className="text-xs text-gray-600">
                    Additional
                  </Label>
                  <Input
                    id="baggage-additional"
                    value={formData.baggage.additional}
                    onChange={(e) =>
                      handleInputChange("baggage.additional", e.target.value)
                    }
                    placeholder="e.g., 10 kg"
                  />
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Traveller"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

