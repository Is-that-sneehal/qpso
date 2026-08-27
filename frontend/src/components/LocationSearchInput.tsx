import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { searchGeocode, type LocationItem } from '../api/client';

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onSelectLocation: (loc: { name: string; coords: [number, number] }) => void;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  value,
  onSelectLocation
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        const res = await searchGeocode(query);
        setResults(res);
        setLoading(false);
        setOpen(true);
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-mono text-[#ffb59e] uppercase mb-1">{label}</label>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-[#e6beb2]/60" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#110b1b] border border-[#5c4037] rounded-lg pl-9 pr-8 py-2 text-sm text-[#e9def5] placeholder-[#e6beb2]/40 focus:outline-none focus:border-[#9dcaff] transition"
        />
        {loading && <Loader2 className="absolute right-3 w-4 h-4 text-[#ffb59e] animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#1e1929] border border-[#5c4037] rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(item.name);
                onSelectLocation({ name: item.name, coords: [item.lat, item.lon] });
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-[#221d2d] border-b border-[#5c4037]/20 last:border-none transition flex items-start gap-2"
            >
              <Search className="w-3.5 h-3.5 text-[#ffb59e] mt-1 shrink-0" />
              <div>
                <div className="text-xs font-medium text-[#e9def5]">{item.name}</div>
                <div className="text-[10px] font-mono text-[#e6beb2]/60 truncate">{item.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
