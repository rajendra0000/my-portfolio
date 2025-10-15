"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

interface TimelineItem {
  logoUrl: string;
  altText: string;
  title: string;
  subtitle: string;
  href?: string;
  badges?: readonly string[];
  period: string;
  bullets?: readonly string[];
}

interface EnhancedTimelineProps {
  items: TimelineItem[];
  delay?: number;
}

export const EnhancedTimeline = ({ items, delay = 0 }: EnhancedTimelineProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="relative max-w-3xl"
    >
      {/* Thin elegant timeline line */}
      <div className="absolute left-4 top-2 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
      
      {/* Timeline items */}
      <div className="space-y-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="relative flex items-start gap-6"
          >
            {/* Small circular dot with integrated logo */}
            <div className="relative z-10 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-background border border-primary/30 flex items-center justify-center shadow-sm">
                <Image
                  src={item.logoUrl}
                  alt={item.altText}
                  width={20}
                  height={20}
                  className="rounded-sm object-cover"
                />
              </div>
            </div>

            {/* Content area - clickable to expand */}
            <div className="flex-1 min-w-0 -mt-1">
              <div 
                className={`cursor-pointer transition-all duration-200 ${
                  item.bullets ? 'hover:bg-muted/30 rounded-lg p-2 -m-2' : ''
                }`}
                onClick={() => item.bullets && toggleExpanded(index)}
              >
                {/* Header with title, subtitle, and date */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    {item.href ? (
                      <Link
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="font-semibold text-base leading-tight hover:text-primary transition-colors whitespace-pre-line">
                          {item.title}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className="font-semibold text-base leading-tight whitespace-pre-line">
                        {item.title}
                      </h3>
                    )}
                    <p className="text-muted-foreground text-sm mt-0.5 font-medium">
                      {item.subtitle}
                    </p>
                  </div>
                  
                  {/* Date - right aligned */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-muted-foreground/80 font-medium">
                      {item.period}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                {item.badges && item.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.badges.map((badge, badgeIndex) => (
                      <Badge
                        key={badgeIndex}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Collapsible bullets with smooth animation */}
                {item.bullets && item.bullets.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: expandedItems.has(index) ? "auto" : 0,
                      opacity: expandedItems.has(index) ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-2 border-t border-border/30">
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {item.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
                
                {/* Subtle click hint for items with bullets */}
                {item.bullets && item.bullets.length > 0 && !expandedItems.has(index) && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground/60 italic">
                      Click to view details
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 