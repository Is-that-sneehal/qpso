import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
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

  // Sync internal query with external value only when external value changes from parent reset/preset
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query.trim() || query === value) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        const res = await searchGeocode(query);
        setResults(res);
        setLoading(false);
        if (res.length > 0) {
          setOpen(true);
        }
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, value]);

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

  const handleSelect = (item: LocationItem) => {
    setQuery(item.name);
    onSelectLocation({ name: item.name, coords: [item.lat, item.lon] });
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[0]);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-mono text-[#ffb59e] uppercase mb-1">{label}</label>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-[#ffb59e]/80" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-[#110b1b] border border-[#5c4037] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[#e9def5] placeholder-[#e6beb2]/40 focus:outline-none focus:border-[#ffb59e] transition shadow-inner"
        />
        {loading ? (
          <Loader2 className="absolute right-3 w-4 h-4 text-[#ffb59e] animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-[#e6beb2]/60 hover:text-[#e9def5]"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#1e1929] border border-[#ffb59e]/40 rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-[#ff5719]/15 border-b border-[#5c4037]/30 last:border-none transition flex items-start gap-2.5 group cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#ffb59e] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#e9def5] group-hover:text-[#ffb59e] transition-colors">{item.name}</div>
                <div className="text-[10px] font-mono text-[#e6beb2]/70 truncate mt-0.5">{item.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
