# My Personal Website

Hey there! Welcome to the codebase for my personal website. What started as a fork of the awesome [heilcheng](https://github.com/heilcheng/heilcheng.github.io) has grown into something I like to call my digital playground.

This portfolio is built with Next.js, styled with Tailwind CSS, and brought to life with Three.js and Framer Motion. It's automatically deployed to GitHub Pages, so it's always up-to-date with my latest experiments.

## Table of Contents

- [Features: The Fun Stuff](#features-the-fun-stuff)
- [Tech Stack: What's Under the Hood?](#tech-stack-whats-under-the-hood-)
- [How to Make This Your Own](#how-to-make-this-your-own)
- [Quick Start](#quick-start)
- [Deployment Magic](#deployment-magic)

## Features: The Fun Stuff

I wanted this site to be a reflection of my personality and passions. Here are some of the key features I've built:

### Interactive 3D Visualizations:

- **Rubik's Cube Solver** (`/src/components/rubiks-cube.tsx`): A fully interactive 3D Rubik's Cube that visualizes the CFOP solving method. It's a nod to my love for algorithms and puzzles, breaking down the solution into the Cross, F2L, OLL, and PLL stages.
  - Color scheme: U=W, D=Y, L=O, R=R, F=G, B=B.
  - Notation: quarter turns and inverses: `U U' U2 D D' D2 L L' L2 R R' R2 F F' F2 B B' B2`.
  - Speed: use the speed slider to tweak ms per quarter turn (150–600ms).
  - Solver: currently animates a correct visual solution segmented by CFOP phases; full two-look OLL/PLL planner is modularized under `src/lib/cfop-solver.ts` for iteration.
  - Limitations: not speed optimal; highlights emphasize U-layer during OLL/PLL; cross/F2L pair highlights are minimal.

- **Protein Folding Viewer** (`/src/components/protein-folding.tsx`): Inspired by AlphaFold, this visualizer shows how a protein chain folds into its complex 3D structure. The colors represent pLDDT confidence scores, and it even includes a Predicted Aligned Error (PAE) plot.

- **Torus-Mug Morph** (`/src/components/torus-mug-morph.tsx`): A fun, interactive demo of topological equivalence. A slider lets you seamlessly morph a 3D torus (a doughnut) into a coffee mug and back again.

### Data-Driven Maps:

- **World Map** (`/src/components/world-map.tsx`): A map of my travels, built with react-simple-maps. It highlights the countries I've visited and gives you a little tooltip on hover.

- **Hong Kong Map** (`/src/components/hong-kong-map.tsx`): A more personal map of my favorite spots in my home city, built with react-leaflet. I've added custom markers for my go-to nature and urban spots.

### Dynamic & UI Features:

- **GitHub Contribution Graph** (`/src/components/github-contributions.tsx`): This is a live look at my coding activity, pulled directly from the GitHub GraphQL API. It's fully responsive, with a neat horizontal scroll on mobile.

- **Aquarium Mode** (`/src/components/aquarium.tsx`): Because why not? A toggleable, full-screen overlay that fills the page with animated fish and shrimp.

- **Smooth Animations** (`/src/components/magicui/`): The beautiful, fluid animations are powered by Magic UI. These are not installed as a package but are included directly in the `src/components/magicui` directory, allowing for full customization. This includes the Dock navigation and the BlurFade effects.

- **MDX Blog** (`/src/app/blog/`): The blog is powered by MDX, which lets me write in Markdown and embed React components right into my posts.

## Tech Stack: What's Under the Hood? 🛠️

I chose a modern, performant, and enjoyable tech stack to build this portfolio.

- **Framework**: Next.js 14 (with App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **3D & Animation**: Three.js, React Three Fiber, & Framer Motion
- **Maps**: React Leaflet & react-simple-maps
- **Deployment**: GitHub Pages with GitHub Actions
- **Package Manager**: pnpm

## How to Make This Your Own

If you like what you see and want to build your own version, feel free to use this as a template!

### 1. Get the Code

Fork the repository and clone it to your local machine.

```bash
git clone https://github.com/YOUR_USERNAME/heilcheng.github.io.git
cd heilcheng.github.io
```

### 2. Install Dependencies

I use pnpm, but you can use npm or yarn as well.

```bash
pnpm install
```

### 3. Personalize It

**Your Info**: All the personal data (name, description, experience, projects, etc.) is in one place: `src/data/resume.tsx`. Just open it up and replace my info with yours.

**Your Maps**:
- For the world map, edit the `visitedCountries` array in `src/components/world-map.tsx`.
- For the Hong Kong map, update the `locations` object in `src/components/hong-kong-map.tsx` with your own favorite spots.

**Your GitHub Graph**: In `src/app/page.tsx`, find the `<GitHubContributions />` component and change the `username` prop to your GitHub username.

### 4. Set Up Your Environment

To get the GitHub contribution graph working, you'll need a Personal Access Token (PAT).

1. Create a `.env.local` file in the root of your project.
2. Add your token like this: `NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here`

## Quick Start

Ready to run it locally?

```bash
pnpm dev
```

This will start the development server at http://localhost:3000.

## Deployment Magic

This portfolio is set up for automatic deployment to GitHub Pages. The workflow in `.github/workflows/deploy.yml` handles everything. Once you've set up your repository, every push to the main branch will automatically trigger the GitHub Action, which will build the site and deploy it to your GitHub Pages URL. Just make sure to add your GitHub PAT as a repository secret named `PERSONAL_ACCESS_TOKEN`.

---

I hope this gives you a good look into how I built my digital playground. Feel free to explore the code, and I'd love to see what you create with it!

