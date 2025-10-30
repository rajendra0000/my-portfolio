import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon, SparklesIcon } from "lucide-react";

export const DATA = {
  name: "Rajendra Singh Rao",
  initials: "RSR",
  url: "https://rajendra0000.github.io/my-portfolio/",
  location: "Udaipur",
  locationLink: "https://www.google.com/maps/place/udaipur",
  description:
    "A curious mind passionate about technology, creativity, and problem-solving. I love learning new things, exploring how ideas become real-world solutions, and building projects that inspire and create impact.",
  summary:
  "I'm a Homo sapiens born and raised in India. I’ve always been curious about how things work — from gadgets and algorithms to the invisible systems that shape our daily lives. That curiosity slowly turned into a passion for creating, for understanding how ideas become real, and how technology can make life a little more meaningful.\n\nBefore diving deep into tech, I was that kid who loved exploring everything — sketching, solving puzzles, experimenting with random apps, and asking too many 'why' questions. Over time, I realized I wasn’t just fascinated by technology itself, but by what it could *do* — the way a few lines of logic could solve something real.\n\nAt some point, I found myself drawn toward building projects that blend creativity, problem-solving, and purpose — from environmental ideas to small digital experiments that make people think or smile. Each project taught me that learning is less about mastering something and more about exploring it deeply.\n\nAnd so, here I am — still learning, still building, and still chasing that feeling of discovery that comes with every new idea.\n\nWhen I’m not lost in a project, you’ll probably find me listening to music, journaling thoughts that turn into new ideas, or out exploring random places just to reset my mind. I believe every experience — big or small — adds a new line to who we’re becoming, and I’m excited to keep writing mine."
,
  avatarUrl: "/me.jpg",

  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
    { href: "/showcase", icon: SparklesIcon, label: "Showcase" },
  ],
  contact: {
    email: "rajendrasinghrao004@gmail.com",
    tel: "+91 9116914178",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/rajendra0000",
        icon: Icons.github,
        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/rajendra-singh-rao/",
        icon: Icons.linkedin,
        navbar: true,
      },

      email: {
        name: "Send Email",
        url: "mailto:rajendrasinghrao004@gmail.com",
        icon: Icons.email,
        navbar: false,
      },
    },
  },

  technicalExperience: [
    {
      company: "Bharat Intern",
      href: "https://infobharatinterns.online/",
      badges: [],
      location: "Remote",
      title: "Web Development Intern",
      logoUrl: "/bharat.jpg",
      start: "April 2024",
      end: "June 2024",
      bullets: [
        "Completed a virtual internship focused on practical front-end web development projects.",
        "Developed responsive websites using HTML, CSS, and JavaScript, integrating public APIs for dynamic content.",
        "Created UI clones of Netflix and Amazon to refine user interface design and responsiveness.",
      ],
    },
    {
      company: "Freelance",
      href: "https://www.fiver.com/",
      badges: [],
      location: "Remote",
      title: "Freelance Software Developer",
      logoUrl: "/freelance.jpg",
      start: "June 2023",
      end: "Present",
      bullets: [
        "Collaborate with clients across diverse domains to design and build custom web and mobile applications using modern technologies like React, Node.js, and Python.",
        "Deliver end-to-end solutions from planning and prototyping to deployment and optimization ensuring scalability, performance, and clean UI/UX design.",
        "Develop automation scripts and lightweight tools to improve client workflows, integrating APIs, databases, and third-party services.",
        "Work closely with small teams and startups to transform ideas into production-ready digital products, maintaining almost 100% client satisfaction rate.",
      ],
    },
  ],
  education: [
    {
      school: "College of Technology and Engineering, Udaipur",
      href: "https://www.ctae.ac.in",
      degree: "Bachelor of Technology in Electronics and Communication Engineering\n(Expected Graduation: 2026)",
      logoUrl: "/ctae.jpg",
      start: "2022",
      end: "2026",
    },
    {
      school: "Kv no.1 udaipur",
      href: "https://www.cbse.gov.in",
      degree: "Senior Secondary Education (Class XII)\nFocused on Physics, Chemistry, and Mathematics.",
      logoUrl: "/cbse.jpg",
      start: "2020",
      end: "2022",
    },
  ],
  projects: [
    {
      title: "Pokémon Review API",
      href: "https://github.com/rajendra0000/pokemon-review-api",
      dates: "2024 - Present",
      active: true,
      description:
        "A RESTful API built with Spring Boot that allows users to post and manage Pokémon reviews. Features JWT-based authentication, CRUD operations, and PostgreSQL persistence with H2 in-memory testing for rapid deployment.",
      technologies: [
        "Spring Boot",
        "Spring Data JPA",
        "PostgreSQL",
        "JWT",
        "H2 Database",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/rajendra0000/pokemon-review-api",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "Real-time Chat Application",
      href: "https://github.com/rajendra0000/chat-app",
      dates: "2024 - Present",
      active: true,
      description:
        "A real-time chat backend built with Spring Boot, RabbitMQ, and Redis for message queuing and caching. Integrated Twilio for OTP-based verification and MinIO for file storage, all orchestrated through Docker Compose.",
      technologies: [
        "Spring Boot",
        "Redis",
        "RabbitMQ",
        "PostgreSQL",
        "Twilio",
        "MinIO",
        "Docker",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/rajendra0000/chat-app",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      "title": "Interactive Personal Portfolio",
      "href": "https://github.com/rajendra0000/my-portfolio",
      "dates": "2024 - Present",
      "active": true,
      "description": "A modern, interactive portfolio demonstrating advanced frontend and 3D visualization skills. Features a functional Rubik's Cube solver, topological morphing, and a live GitHub contribution graph.",
      "technologies": [
        "Next.js 14 (App Router)",
        "TypeScript",
        "Three.js",
        "React Three Fiber",
        "Framer Motion",
        "Tailwind CSS",
        "GitHub Actions (CI/CD)",
        "GraphQL"
      ],
      "links": [
        {
          "type": "Source",
          "href": "https://github.com/rajendra0000/my-portfolio",
          "icon": <Icons.github className="size-3" />
        },
        {
          "type": "Live Demo",
          "href": "https://rajendra0000.github.io/my-portfolio/",
          "icon": <Icons.globe className="size-3" />
        }
      ],
      "image": "",
      "video": ""
    },
    {
      "title": "Board-Collab",
      "href": "https://github.com/rajendra0000/Board-Collab",
      "dates": "2024 - Present",
      "active": true,
      "description": "A real-time collaborative whiteboard web application that allows multiple users to draw, write, and annotate together. Features include live multi-user sync, email-based collaboration invites, and export options for saving boards.",
      "technologies": [
        "React",
        "TypeScript",
        "Fabric.js",
        "Firebase Firestore",
        "Node.js",
        "Express",
        "Socket.io",
        "Nodemailer",
        "Tailwind CSS",
        "Vercel",
        "Render"
      ],
      "links": [
        {
          "type": "Source",
          "href": "https://github.com/rajendra0000/Board-Collab",
          "icon": "<Icons.github className=\"size-3\" />"
        },
        {
          "type": "Live Demo",
          "href": "https://board-collab.vercel.app/",
          "icon": "<Icons.globe className=\"size-3\" />"
        }
      ],
      "image": "",
      "video": ""
    },
    {
      title: "Hotel Management System",
      href: "https://github.com/rajendra0000/hotel-management-system",
      dates: "2023 - 2024",
      active: false,
      description:
        "A console-based Java application for hotel management, featuring user and admin roles, room CRUD operations, and JSON-based persistence. Demonstrates OOP design principles, modular structure, and concurrency handling.",
      technologies: [
        "Core Java",
        "JSON",
        "OOP",
        "Multithreading",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/rajendra0000/hotel-management-system",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "Climate & Fitness Awareness Websites",
      href: "#",
      dates: "2023",
      active: false,
      description:
        "Developed as part of a web development internship, these websites integrate public APIs and feature responsive, interactive front-end design using HTML, CSS, and JavaScript.",
      technologies: [
        "HTML",
        "CSS",
        "JavaScript",
        "API Integration",
      ],
      links: [],
      image: "",
      video: "",
    },
  ],
  books: [
    {
      theme: "Technology & Innovation",
      books: [
        {
          title: "The Innovators",
          author: "Walter Isaacson",
          number: 1,
        },
        {
          title: "Clean Code",
          author: "Robert C. Martin",
          number: 2,
        },
        {
          title: "The Pragmatic Programmer",
          author: "Andrew Hunt & David Thomas",
          number: 3,
        },
      ],
    },
    {
      theme: "Artificial Intelligence & Future Thinking",
      books: [
        {
          title: "Life 3.0: Being Human in the Age of Artificial Intelligence",
          author: "Max Tegmark",
          number: 4,
        },
        {
          title: "Superintelligence",
          author: "Nick Bostrom",
          number: 5,
        },
      ],
    },
    {
      theme: "Entrepreneurship & Mindset",
      books: [
        {
          title: "Zero to One",
          author: "Peter Thiel",
          number: 6,
        },
        {
          title: "The Lean Startup",
          author: "Eric Ries",
          number: 7,
        },
        {
          title: "Atomic Habits",
          author: "James Clear",
          number: 8,
        },
      ],
    },
    {
      theme: "Design & Creativity",
      books: [
        {
          title: "The Design of Everyday Things",
          author: "Don Norman",
          number: 9,
        },
        {
          title: "Show Your Work!",
          author: "Austin Kleon",
          number: 10,
        },
      ],
    },
    {
      theme: "Personal Growth & Reflection",
      books: [
        {
          title: "Man’s Search for Meaning",
          author: "Viktor E. Frankl",
          number: 11,
        },
        {
          title: "Deep Work",
          author: "Cal Newport",
          number: 12,
        },
      ],
    },
  ],
} as const;
