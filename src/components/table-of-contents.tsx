"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";

// Define the sections of your page
const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "rubiks-cube", label: "Rubik's Cube" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "books", label: "Books" },
  { id: "hong-kong", label: "Hong Kong" },
  { id: "world", label: "World" },
  { id: "contact", label: "Contact" },
];

export function TableOfContents() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [hasViewedAllSections, setHasViewedAllSections] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const handleNextSection = () => {
    if (hasViewedAllSections) {
      // Redirect to GitHub
      window.open('https://github.com/heilcheng', '_blank');
      return;
    }

    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < SECTIONS.length) {
      setCurrentSectionIndex(nextIndex);
      const nextSection = document.getElementById(SECTIONS[nextIndex].id);
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // All sections viewed, next click will go to GitHub
      setHasViewedAllSections(true);
    }
  };

  useEffect(() => {
    // Set up the Intersection Observer to watch for sections entering the viewport
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            // Update current section index
            const sectionIndex = SECTIONS.findIndex(s => s.id === entry.target.id);
            if (sectionIndex !== -1) {
              setCurrentSectionIndex(sectionIndex);
              setHasViewedAllSections(false);
            }
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" } // Trigger when section is in the middle of the screen
    );

    // Observe each section
    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) {
        observer.current?.observe(el);
      }
    });

    // Clean up the observer on component unmount
    return () => {
      SECTIONS.forEach((section) => {
        const el = document.getElementById(section.id);
        if (el) {
          observer.current?.unobserve(el);
        }
      });
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="hidden md:block fixed top-1/2 right-4 transform -translate-y-1/2 z-50"
      >
        <ul className="flex flex-col items-center space-y-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(section.id);
                }}
                className="group flex items-center gap-2"
              >
                <span className="text-right text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:text-gray-300 text-gray-700">
                  {section.label}
                </span>
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-300",
                    activeSection === section.id
                      ? "bg-blue-400 scale-125"
                      : "group-hover:bg-blue-300"
                  )}
                />
              </a>
            </li>
          ))}
        </ul>
      </motion.nav>

      {/* Mobile Navigation - Navbar Style */}
      <div className="md:hidden fixed top-4 right-4 z-50 flex gap-2">
        {/* Next Section Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNextSection}
          className={cn(
            "size-12 bg-background backdrop-blur-lg border rounded-full flex items-center justify-center shadow-lg [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
            hasViewedAllSections && "bg-green-100 dark:bg-green-900"
          )}
          title={hasViewedAllSections ? "Go to GitHub" : "Next Section"}
        >
          <ChevronDown className="size-4 text-foreground" />
        </motion.button>

        {/* Content Page Dot */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-14 right-0 bg-background backdrop-blur-lg border rounded-lg shadow-xl [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] p-3"
            >
              <ul className="flex flex-col space-y-2">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollTo(section.id);
                      }}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                        activeSection === section.id
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="size-12 bg-background backdrop-blur-lg border rounded-full flex items-center justify-center shadow-lg [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]"
        >
          <motion.div
            animate={{ rotate: isMobileMenuOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-foreground"
          >
            <ChevronRight className="size-4" />
          </motion.div>
        </motion.button>
      </div>


    </>
  );
} 