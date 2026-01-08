"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, LogOut, Ticket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Event } from "@/data/events";

const locations = [
  "San Francisco, CA",
  "Los Angeles, CA",
  "Oakland, CA",
  "San Jose, CA",
  "Seattle, WA",
  "New York, NY",
];

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Select Location");
  const [locationLoading, setLocationLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Click outside listener for profile dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    setProfileOpen(false);
  }

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Sync with URL on mount/update
  useEffect(() => {
    const city = searchParams.get('city');
    if (city && city !== 'All') {
      const match = locations.find(l => l.includes(city));
      setSelectedLocation(match || city);
    } else {
      setSelectedLocation("All Cities");
    }
  }, [searchParams]);

  // Debounced Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.events || []);
            setShowResults(true);
          }
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const updateLocation = (city: string, displayLabel?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (city === "All Cities" || city === "All") {
      params.delete("city");
    } else {
      const cleanCity = city.includes(',') ? city.split(',')[0].trim() : city;
      params.set("city", cleanCity);
    }
    router.replace(`/?${params.toString()}`);
    setSelectedLocation(displayLabel || city);
    setLocationOpen(false);
  };

  const handleLocationSelect = (loc: string) => {
    updateLocation(loc);
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();

          const city = data.address.city || data.address.town || data.address.village || data.address.county;

          if (city) {
            updateLocation(city, `${city} (Detected)`);
          } else {
            alert("Could not detect city");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          alert("Failed to detecting location");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationLoading(false);
      }
    );
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 bg-[#0B0B0F]/80 px-5 py-4 backdrop-blur-xl transition-all duration-300 sm:px-8 md:py-6">
      {/* Location selector - Left side */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setLocationOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-[#A855F7]/40 bg-gradient-to-r from-[#12121A] to-[#12121A]/80 px-3 py-1.5 text-sm text-[#F4F4F5] shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all hover:border-[#A855F7]/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#12121A] text-xs text-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.5)]">
            ●
          </span>
          <span className="truncate max-w-[130px] sm:max-w-[180px]">
            {locationLoading ? "Locating..." : selectedLocation}
          </span>
          <span className="text-xs text-[#A1A1AA]">▾</span>
        </button>

        <AnimatePresence>
          {locationOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 top-11 w-64 rounded-2xl border border-[#A855F7]/30 bg-[#12121A]/95 p-3 text-sm shadow-2xl backdrop-blur-2xl"
            >
              <button
                onClick={handleAutoDetect}
                disabled={locationLoading}
                className="mb-2 flex w-full items-center justify-between rounded-xl bg-[#12121A] px-3 py-2 text-xs text-[#EC4899] ring-1 ring-[#EC4899]/40 transition-colors hover:bg-[#12121A]/80 disabled:opacity-50"
              >
                <span>{locationLoading ? "Detecting..." : "Auto-detect my location"}</span>
                <span className="text-[10px] opacity-80">◎</span>
              </button>

              <div className="space-y-1">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocationSelect(loc)}
                    className={`block w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-[#A855F7]/10 hover:text-[#F4F4F5] ${selectedLocation === loc ? "text-[#A855F7] font-medium bg-[#A855F7]/5" : "text-[#F4F4F5]"
                      }`}
                  >
                    {loc}
                  </button>
                ))}
                <button
                  onClick={() => handleLocationSelect("All Cities")}
                  className={`block w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-[#A855F7]/10 hover:text-[#F4F4F5] ${selectedLocation === "All Cities" ? "text-[#A855F7] font-medium bg-[#A855F7]/5" : "text-[#F4F4F5]"
                    }`}
                >
                  All Cities
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brand - Absolutely centered */}
      <div className="absolute left-1/2 flex -translate-x-1/2 translate-y-4 items-center md:translate-y-6">
        <Link href="/" className="text-4xl font-black uppercase tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] via-[#db2777] to-[#EC4899] transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_25px_rgba(219,39,119,0.7)] drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] sm:text-5xl md:text-6xl">
          MUSITIX
        </Link>
      </div>

      {/* Search + Auth / profile - Right side */}
      <div className="flex flex-shrink-0 items-center gap-3 text-xs sm:text-sm">
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex h-9 w-9 items-center justify-center rounded-full border border-[#A855F7]/30 bg-[#12121A]/60 backdrop-blur-md transition-all duration-200 hover:border-[#A855F7]/50 hover:bg-[#12121A]/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
        >
          <Search className="h-4 w-4 text-[#A855F7]/70 transition-colors group-hover:text-[#A855F7]" strokeWidth={2} />
        </button>
        {session ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EC4899]/60 bg-[#EC4899]/20 text-sm text-[#EC4899] shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all hover:shadow-[0_0_25px_rgba(236,72,153,0.7)] overflow-hidden"
            >
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Ava" width={36} height={36} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
              ) : (
                (profile?.full_name?.[0] || session.user.email?.[0] || "U").toUpperCase()
              )}
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-48 rounded-xl border border-[#A855F7]/30 bg-[#12121A]/95 p-1.5 shadow-2xl backdrop-blur-2xl overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-[#A855F7]/10 mb-1">
                    <p className="font-bold text-white truncate text-xs">{profile?.full_name || "User"}</p>
                    <p className="text-[10px] text-[#A1A1AA] truncate">{session.user.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#F4F4F5] hover:bg-[#A855F7]/10 hover:text-[#A855F7] transition-colors" onClick={() => setProfileOpen(false)}>
                    <User className="h-3.5 w-3.5" /> My Profile
                  </Link>
                  <Link href="/profile" className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#F4F4F5] hover:bg-[#A855F7]/10 hover:text-[#A855F7] transition-colors text-left" onClick={() => setProfileOpen(false)}>
                    <Ticket className="h-3.5 w-3.5" /> My Bookings
                  </Link>
                  <div className="my-1 h-px bg-[#A855F7]/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link href="/login" className="rounded-full border border-[#A855F7]/50 bg-[#12121A]/80 px-3 py-1.5 text-[11px] font-medium text-[#F4F4F5] shadow-[0_0_14px_rgba(168,85,247,0.3)] transition-all hover:border-[#A855F7] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] sm:px-4 sm:text-xs">
            Login / <span className="text-[#EC4899]">Signup</span>
          </Link>
        )}
      </div>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/80 backdrop-blur-xl"
            onClick={closeSearch}
          >
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="mx-auto mt-16 w-full max-w-xl rounded-3xl border border-[#A855F7]/50 bg-gradient-to-br from-[#12121A] via-[#0B0B0F] to-[#12121A] px-5 py-4 shadow-[0_0_40px_rgba(168,85,247,0.4)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-[#A855F7]/10 pb-2">
                <Search className="h-4 w-4 text-[#A855F7]" strokeWidth={2} />
                <input
                  autoFocus
                  placeholder="Search artists, events, or venues..."
                  className="flex-1 bg-transparent text-sm text-[#F4F4F5] outline-none placeholder:text-[#A1A1AA]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') closeSearch();
                  }}
                />
                <button
                  onClick={closeSearch}
                  className="rounded-full px-3 py-1 text-[11px] text-[#A1A1AA] transition-colors hover:text-[#F4F4F5]"
                >
                  ESC
                </button>
              </div>

              {/* Live Search Results */}
              <div className="mt-2 text-sm text-[#A1A1AA]">
                {isSearching ? (
                  <div className="py-4 text-center text-xs">Searching...</div>
                ) : searchQuery.length > 1 && showResults ? (
                  searchResults.length > 0 ? (
                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar space-y-2 mt-2">
                      {searchResults.map(event => (
                        <Link
                          href={`/events/${event.id}`}
                          key={event.id}
                          onClick={closeSearch}
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-[#A855F7]/10 transition-colors group"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                            <Image src={event.image} alt={event.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#F4F4F5] truncate group-hover:text-[#A855F7] transition-colors">{event.name}</h4>
                            <p className="text-xs text-[#A1A1AA] truncate">{event.date} • {event.city}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs">No events found matching "{searchQuery}"</div>
                  )
                ) : searchQuery.length > 0 && searchQuery.length < 2 ? (
                  <div className="py-2 text-center text-xs opacity-50">Type at least 2 characters</div>
                ) : null}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
