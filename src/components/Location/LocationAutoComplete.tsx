import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { Autocomplete, AutocompleteItem, addToast } from "@heroui/react";
import { MapPin, Loader2, LocateFixed, AlertCircle } from "lucide-react";
import type { Key } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import type {
  LocationAutoCompleteRef,
  PlacePrediction,
  PredictionItem,
  AutocompleteSuggestionRequest,
  LocationAutoCompleteProps,
} from "./types/LocationAutoComplete.types";
import { useTranslation } from "react-i18next";

interface EnhancedLocationAutoCompleteProps extends LocationAutoCompleteProps {
  initialLocation?: {
    placeName: string;
    latLng: { lat: number; lng: number };
    placeDescription: string;
  } | null;
}

const LocationAutoComplete = forwardRef<
  LocationAutoCompleteRef,
  EnhancedLocationAutoCompleteProps
>(({ onLocationSelect, initialLocation }, ref) => {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const allowedCountries = useMemo(() => {
    return webSettings?.enableCountryValidation
      ? webSettings?.allowedCountries || []
      : [];
  }, [webSettings?.allowedCountries, webSettings?.enableCountryValidation]);

  const [inputValue, setInputValue] = useState<string>("");
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<PlacePrediction | null>(null);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    setInputValue: (value: string) => {
      setInputValue(value);
      if (value && initialLocation) {
        setSelected({
          mainText: { text: initialLocation.placeName },
          secondaryText: { text: initialLocation.placeDescription },
          placeId: "",
        });
      }
    },
  }));

  useEffect(() => {
    if (initialLocation && !isInitialized) {
      const displayText = initialLocation.placeDescription
        ? `${initialLocation.placeName}, ${initialLocation.placeDescription}`
        : initialLocation.placeName;
      setInputValue(displayText);
      setSelected({
        mainText: { text: initialLocation.placeName },
        secondaryText: { text: initialLocation.placeDescription },
        placeId: "",
      });
      setIsInitialized(true);
    } else if (!initialLocation && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initialLocation, isInitialized]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.google === "undefined") return;
    if (!isInitialized) return;

    if (
      initialLocation &&
      inputValue ===
        (initialLocation.placeDescription
          ? `${initialLocation.placeName}, ${initialLocation.placeDescription}`
          : initialLocation.placeName)
    ) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    if (inputValue && inputValue.length > 1) {
      setLoading(true);
      if (timeoutId.current) clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(async () => {
        try {
          const { AutocompleteSuggestion, AutocompleteSessionToken } =
            (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
          const token = new AutocompleteSessionToken();
          const request: AutocompleteSuggestionRequest = {
            input: inputValue,
            sessionToken: token,
            includedRegionCodes: allowedCountries,
          };
          const { suggestions } =
            await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          setPredictions(
            suggestions
              .filter((s) => s.placePrediction)
              .map((s) => ({
                key: s.placePrediction!.placeId,
                label: s.placePrediction!.mainText?.text || "",
                description: s.placePrediction!.secondaryText?.text || "",
                original: s.placePrediction!,
              }))
          );
        } catch (error) {
          console.error("Error fetching predictions:", error);
          setPredictions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setPredictions([]);
      setLoading(false);
    }
    return () => { if (timeoutId.current) clearTimeout(timeoutId.current); };
  }, [inputValue, isInitialized, initialLocation, allowedCountries]);

  const handleSelectionChange = async (key: Key | null): Promise<void> => {
    if (!key) { setSelected(null); return; }
    const selectedItem = predictions.find((item) => item.key === key);
    if (!selectedItem) return;
    setSelected(selectedItem.original);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ placeId: String(key) });
      if (result?.results[0]?.geometry?.location) {
        const { lat, lng } = result.results[0].geometry.location.toJSON();
        onLocationSelect({
          placeName: selectedItem.label,
          latLng: { lat, lng },
          placeDescription: selectedItem.description,
        });
        setInputValue(selectedItem.description
          ? `${selectedItem.label}, ${selectedItem.description}`
          : selectedItem.label);
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setLocationError(null);
    if (selected && value !== inputValue) setSelected(null);
  };

  const handleGetCurrentLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported. Please search for your location manually.");
      return;
    }

    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      setLocationError("Location detection requires HTTPS. Please search for your location manually.");
      return;
    }

    setGettingCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
        try {
          const { Geocoder } = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
          const result = await new Geocoder().geocode({ location: latLng });
          const placeName = result?.results[0]?.formatted_address || "Current Location";
          onLocationSelect({ placeName, latLng, placeDescription: "" });
          setInputValue(placeName);
          setSelected({ mainText: { text: placeName }, secondaryText: { text: "" }, placeId: "" });
          addToast({ title: "Location detected", color: "success" });
        } catch (e) {
          setLocationError("Could not get address. Please search manually.");
        } finally {
          setGettingCurrentLocation(false);
        }
      },
      (error) => {
        setGettingCurrentLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location access denied. Enable location in your browser settings, or type your address in the search box above."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Location unavailable. Please search for your address manually.");
        } else {
          setLocationError("Could not detect location. Please search manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="w-full space-y-2">
      <Autocomplete
        aria-label="Location selector"
        inputValue={inputValue}
        onInputChange={handleInputChange}
        items={predictions}
        placeholder={t("enter-city-or-address") || "Search city or address..."}
        variant="faded"
        allowsCustomValue={true}
        classNames={{
          base: "group-data-[focus-visible=true]:ring-0",
          selectorButton: "hidden",
        }}
        startContent={
          loading
            ? <Loader2 className="h-5 w-5 text-default-400 animate-spin" />
            : <MapPin className="h-5 w-5 text-default-400" />
        }
        listboxProps={{
          emptyContent: inputValue.length > 1 && !loading ? "No locations found. Try a different search." : "",
        }}
        endContent={
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={gettingCurrentLocation}
            title="Detect my current location"
            aria-label="Detect my current location"
            className="p-1 rounded-full hover:bg-default-200 cursor-pointer disabled:opacity-50"
          >
            {gettingCurrentLocation
              ? <Loader2 className="h-5 w-5 text-default-400 animate-spin" />
              : <LocateFixed className="h-5 w-5 text-primary" />
            }
          </button>
        }
        onSelectionChange={handleSelectionChange}
      >
        {(item: PredictionItem) => (
          <AutocompleteItem key={item.key} textValue={item.label}>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-default-500 flex-shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium truncate">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-default-500 truncate">{item.description}</span>
                )}
              </div>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>

      {locationError && (
        <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-warning-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-warning-700 leading-relaxed">{locationError}</p>
        </div>
      )}
    </div>
  );
});

LocationAutoComplete.displayName = "LocationAutoComplete";
export default LocationAutoComplete;
