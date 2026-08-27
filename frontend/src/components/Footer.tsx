import React from 'react';
import { Share2, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#110b1b] border-t border-[#5c4037]/30 text-[#e6beb2] pt-12 pb-8 px-6 mt-16">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-[#5c4037]/20 text-xs">
          
          {/* Column 1: Platform */}
          <div>
            <h4 className="font-semibold text-[#e9def5] mb-3 uppercase tracking-wider text-[11px] font-mono text-[#ffb59e]">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-[#e9def5] transition">Features</a></li>
              <li><a href="#api" className="hover:text-[#e9def5] transition">API Reference</a></li>
              <li><a href="#network" className="hover:text-[#e9def5] transition">Network Map</a></li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h4 className="font-semibold text-[#e9def5] mb-3 uppercase tracking-wider text-[11px] font-mono text-[#ffb59e]">Solutions</h4>
            <ul className="space-y-2">
              <li><a href="#urban" className="hover:text-[#e9def5] transition">Urban Transit</a></li>
              <li><a href="#logistics" className="hover:text-[#e9def5] transition">Logistics</a></li>
              <li><a href="#ops" className="hover:text-[#e9def5] transition">Real-time Ops</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="font-semibold text-[#e9def5] mb-3 uppercase tracking-wider text-[11px] font-mono text-[#ffb59e]">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#docs" className="hover:text-[#e9def5] transition">Documentation</a></li>
              <li><a href="#cases" className="hover:text-[#e9def5] transition">Case Studies</a></li>
              <li><a href="#papers" className="hover:text-[#e9def5] transition">Whitepapers</a></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="font-semibold text-[#e9def5] mb-3 uppercase tracking-wider text-[11px] font-mono text-[#ffb59e]">Company</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="hover:text-[#e9def5] transition">About</a></li>
              <li><a href="#careers" className="hover:text-[#e9def5] transition">Careers</a></li>
              <li><a href="#contact" className="hover:text-[#e9def5] transition">Contact</a></li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h4 className="font-semibold text-[#e9def5] mb-3 uppercase tracking-wider text-[11px] font-mono text-[#ffb59e]">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#privacy" className="hover:text-[#e9def5] transition">Privacy</a></li>
              <li><a href="#terms" className="hover:text-[#e9def5] transition">Terms</a></li>
              <li><a href="#security" className="hover:text-[#e9def5] transition">Security</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright & Icon buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-xs text-[#e6beb2]/60 gap-4">
          <p>© 2024 Quantum Route Optimization. Powered by Neural Traffic.</p>
          <div className="flex items-center gap-3">
            <button className="p-1.5 rounded-md hover:bg-[#221d2d] text-[#e6beb2] hover:text-[#e9def5] transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[#221d2d] text-[#e6beb2] hover:text-[#e9def5] transition">
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
