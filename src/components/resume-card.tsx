"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ResumeCardProps {
  logoUrl: string;
  altText: string;
  title: string;
  subtitle?: string;
  href?: string;
  badges?: readonly string[];
  period: string;
  description?: string;
  bullets?: readonly string[];
}

interface TimelineItemProps {
  logoUrl: string;
  altText: string;
  title: string;
  subtitle?: string;
  href?: string;
  badges?: readonly string[];
  period: string;
  description?: string;
  bullets?: readonly string[];
  isLast?: boolean;
}

export const TimelineItem = ({
  logoUrl,
  altText,
  title,
  subtitle,
  href,
  badges,
  period,
  description,
  bullets,
  isLast = false,
}: TimelineItemProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (description || bullets) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const content = (
    <div className="relative pl-6 sm:pl-8 pb-8 sm:pb-12 last:pb-0">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 sm:left-6 top-10 sm:top-12 bottom-0 w-0.5 bg-gradient-to-b from-border to-muted/30" />
      )}
      
      {/* Timeline dot with logo */}
      <div className="absolute left-0 top-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-background shadow-lg bg-background flex items-center justify-center">
        <Avatar className="size-6 sm:size-10 border">
          <AvatarImage
            src={logoUrl}
            alt={altText}
            className="object-contain"
          />
          <AvatarFallback className="text-xs">{altText[0]}</AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="group cursor-pointer" onClick={handleClick}>
        <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
          {/* Header */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed whitespace-pre-line">
                  {subtitle}
                </p>
              )}
              {/* Badges moved below title on mobile */}
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {badges.map((badge, index) => (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      key={index}
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                {period}
              </span>
              {(description || bullets) && (
                <ChevronRightIcon
                  className={cn(
                    "size-4 text-muted-foreground transition-all duration-300 mt-0.5",
                    isExpanded ? "rotate-90" : "rotate-0"
                  )}
                />
              )}
            </div>
          </div>

          {/* Expandable content */}
          {(description || bullets) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: isExpanded ? 1 : 0,
                height: isExpanded ? "auto" : 0,
              }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border/30">
                {bullets ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {bullets.map((bullet, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  if (href && href !== "#") {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </Link>
    );
  }

  return content;
};

export const ResumeCard = ({
  logoUrl,
  altText,
  title,
  subtitle,
  href,
  badges,
  period,
  description,
  bullets,
}: ResumeCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (description || bullets) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Link
      href={href || "#"}
      className="block cursor-pointer"
      onClick={handleClick}
    >
      <Card className="flex p-0">
        <div className="flex-none p-content-md">
          <Avatar className="border size-12 m-auto bg-muted-background dark:bg-foreground">
            <AvatarImage
              src={logoUrl}
              alt={altText}
              className="object-contain"
            />
            <AvatarFallback>{altText[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow items-center flex-col group">
          <CardHeader className="p-content-md">
            <div className="flex items-center justify-between gap-x-2 text-base">
              <h3 className="inline-flex items-center justify-center font-semibold leading-none text-xs sm:text-sm">
                {title}
                {badges && (
                  <span className="inline-flex gap-x-1 ml-2">
                    {badges.map((badge, index) => (
                      <Badge
                        variant="secondary"
                        className="align-middle text-xs"
                        key={index}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </span>
                )}
                <ChevronRightIcon
                  className={cn(
                    "size-4 translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100 ml-1",
                    isExpanded ? "rotate-90" : "rotate-0"
                  )}
                />
              </h3>
              <div className="text-xs sm:text-sm tabular-nums text-muted-foreground text-right">
                {period}
              </div>
            </div>
            {subtitle && (
              <div className="font-sans text-xs whitespace-pre-line">
                {subtitle}
              </div>
            )}
          </CardHeader>
          {(description || bullets) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: isExpanded ? 1 : 0,
                height: isExpanded ? "auto" : 0,
              }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="px-content-md pb-content-md text-xs sm:text-sm"
            >
              {bullets ? (
                <ul className="list-disc list-inside space-y-1">
                  {bullets.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              ) : (
                description
              )}
            </motion.div>
          )}
        </div>
      </Card>
    </Link>
  );
};
