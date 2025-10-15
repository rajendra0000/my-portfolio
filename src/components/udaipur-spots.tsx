"use client";

import BlurFade from "./magicui/blur-fade";

interface UdaipurSpotsProps {
  delay?: number;
}

export const UdaipurSpots = ({ delay = 0 }: UdaipurSpotsProps) => {
  const spotCategories = [
    {
      theme: "Lakes & Nature",
      spots: [
        "Watching the sunset from the Monsoon Palace (Sajjangarh)",
        "Boating on the serene waters of Lake Pichola",
        "Enjoying an evening stroll around Fateh Sagar Lake",
        "Visiting the beautiful gardens of Saheliyon Ki Bari",
        "Experiencing the panoramic city views from the Karni Mata Ropeway",
      ],
    },
    {
      theme: "Culture & City Life",
      spots: [
        "Exploring the majestic Udaipur City Palace complex",
        "Walking through the vibrant old city markets near Jagdish Temple",
        "Dining at a rooftop restaurant with a view of the lake",
        "Witnessing the spectacular light and sound show at the City Palace",
        "Enjoying the stunning evening views from Ambrai Ghat",
      ],
    },
  ];

  return (
    <BlurFade delay={delay}>
      <div className="space-y-12 w-full py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Jewels of Udaipur.
            </h2>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              A collection of my favorite spots and activities in the City of Lakes.
            </p>
          </div>
        </div>
        
        <BlurFade delay={delay + 0.1}>
          <div className="space-y-8">
            {spotCategories.map((category, categoryId) => (
              <div key={category.theme} className="space-y-4">
                <BlurFade delay={delay + 0.2 + categoryId * 0.1}>
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    {category.theme}
                  </h3>
                </BlurFade>
                <ul className="mb-4 ml-4 divide-y divide-dashed border-l">
                  {category.spots.map((spot, spotId) => (
                    <BlurFade
                      key={spot}
                      delay={delay + 0.3 + categoryId * 0.1 + spotId * 0.05}
                    >
                      <li className="py-2 pl-4">
                        <div className="text-base font-medium">
                          {spot}
                        </div>
                      </li>
                    </BlurFade>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>
    </BlurFade>
  );
};