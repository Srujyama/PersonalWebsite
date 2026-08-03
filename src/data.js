// data.js — single source of truth for site content, shared across pages.

export const profile = {
  name: "Srujan Yamali",
  location: "Bay Area • Philadelphia • NYC",
  email: "srujanyamali@berkeley.edu",
  phone: "(302) 509-8614",
  site: "srujanyamali.com",
  github: "github.com/srujyama",
  linkedin: "linkedin.com/in/srujanyamali",
  // The sidebar's standing introduction — two lines, present on every page.
  bio: "I work on LLM tooling at Visa. Before that I built the computer vision and genomics pipelines that research labs at Penn, CHOP and Cornell ran their experiments on.",
  // Both live in public/. `resume` is the one every CTA points at.
  resume: "/Srujan_Yamali_SWE_Resume_June_2026.pdf",
};

// `label` drives the inline icons in src/icons.jsx; the CDN `img`/`alt` pair is
// what the 3D world's mailbox panel still paints.
export const socialLinks = [
  {
    label: "GitHub",
    img: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
    alt: "GitHub",
    href: "https://github.com/srujyama",
  },
  {
    label: "LinkedIn",
    img: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
    alt: "LinkedIn",
    href: "https://linkedin.com/in/srujanyamali",
  },
  {
    label: "Email",
    img: "https://cdn-icons-png.flaticon.com/512/561/561127.png",
    alt: "Email",
    href: "mailto:srujanyamali@berkeley.edu",
  },
];

export const skills = [
  {
    label: "Languages & Frameworks",
    items: "Python, JavaScript, TypeScript, C/C++, Rust, Java, SQL, HTML/CSS, Node.js",
  },
  {
    label: "Libraries & Tools",
    items:
      "React, AWS (S3, EC2, RDS), GCP, Azure, Git, Linux, Flask, Django, Docker, Kubernetes, MySQL, PostgreSQL, SQLAlchemy, REST APIs, Tailwind CSS, NumPy, Pandas, LangChain, Pinecone",
  },
  {
    label: "AI / ML",
    items: "PyTorch, TensorFlow, OpenCV, scikit-learn, Hugging Face",
  },
];

export const education = {
  school: "University of California, Berkeley",
  degree: "B.S. in Computer Science",
  logo: "/Seal_of_University_of_California_Berkeley.png",
  coursework:
    "Machine Learning, Computer Architecture, Data Structures, Algorithms, Discrete Mathematics & Probability Theory, Signals & Systems, Circuits & Devices, Linear Algebra, Artificial Intelligence, Efficient Algorithms",
};

export const experience = [
  {
    org: "SpaceX",
    role: "Contract Engineer (via subcontractor)",
    where: "Remote",
    dates: "July 2026 – Present",
    logo: "/SpaceX-Logo.png",
    description:
      "Contract engineering work for SpaceX through a subcontractor.",
  },
  {
    org: "Visa",
    role: "Software Engineer Intern",
    where: "Remote",
    dates: "Jan 2025 – Present",
    logo: "/visa.png",
    stack: "Python, LLMs, Internal tooling",
    bullets: [
      "Led end-to-end development and deployment of internal LLM tooling used across the risk and product organisations, cutting manual review effort.",
      "Architected and scaled an AI-driven Statement of Work pipeline, improving drafting accuracy by 31%.",
    ],
  },
  {
    org: "Mercor",
    role: "Software Engineer",
    where: "San Francisco, CA",
    dates: "Aug 2024 – Jan 2025",
    logo: "/Mercor_Logo.png",
    stack: "TypeScript, Python, Data pipelines",
    bullets: [
      "Engineered enterprise-scale AI/ML developer tooling for workflows running inside top AI labs' production environments.",
      "Architected and shipped a production experimentation service with APIs and data pipelines handling 2,000 daily events.",
    ],
  },
  {
    org: "Children's Hospital of Philadelphia",
    role: "Data Science Intern",
    where: "Philadelphia, PA",
    dates: "June 2024 – Aug 2025",
    logo: "/UniversityofPennsylvania_Shield_RGB-2.png",
    stack: "Python, NumPy, Multiprocessing",
    bullets: [
      "Built a high-performance time-series pipeline to detect distributional shifts in high-dimensional biological signals.",
      "Designed a parallelised analytics framework with Python multiprocessing to accelerate large-scale genomic comparisons.",
    ],
  },
  {
    org: "Cornell University",
    role: "Machine Learning Engineer Intern",
    where: "Remote",
    dates: "Sept 2023 – May 2024",
    logo: "/Cornell_University_seal.png",
    stack: "PyTorch, YOLO, OpenCV",
    bullets: [
      "Implemented YOLO-based detection and multi-object tracking for automated identification of dynamic entities in unstructured video, reaching 85%+ accuracy across 500 hours of footage.",
      "Built deep-learning vision systems that detect, track and analyse individual and group behaviour in large video datasets under noisy, uncontrolled conditions.",
    ],
  },
  {
    org: "University of Delaware",
    role: "Software Development Intern",
    where: "Newark, DE",
    dates: "June 2023 – Aug 2023",
    logo: "/Udel.png",
    stack: "Python, PyQt6, OpenCV",
    bullets: [
      "Developed a PyQt6/OpenCV desktop application automating analysis of 730 GB of high-resolution video, reducing manual annotation effort by 90%.",
      "Implemented a real-time ROI tracking engine using blob detection and centroid motion modelling, achieving 99.7% tracking accuracy.",
    ],
  },
];

/* Projects = things built for their own sake (research tooling, writing).
   Ventures = products with users, a domain, or a company behind them. */
export const projects = [
  {
    name: "FlyFlirt",
    subtitle: "Real-Time Behavioral Detection and Tracking",
    tagline: "Teaching computers to watch fruit flies flirt",
    stack: "Python, OpenCV, PyQt6, Pandas",
    github: "https://github.com/Srujyama/FlyFlirt",
    description:
      "A real-time computer vision pipeline that tracks Drosophila courtship through hundreds of hours of video. Scoring the same behaviour by hand is what it replaced, and it cut the time that took by about 90%.",
  },
  {
    name: "RedCarpet",
    subtitle: "Genomic Changepoint Detection",
    tagline: "Finding where bacterial genomes swapped DNA",
    stack: "Python, Ruptures, Scikit-learn, Matplotlib",
    github: "https://github.com/microbialARC/Redcarpet",
    description:
      "A changepoint detector that finds recombination in bacterial genomes. It reads the similarity between proteins as a signal running along the chromosome and marks the places where that signal shifts, because a shift is where a block of DNA arrived from somewhere else.",
  },
  {
    name: "Thoughts",
    subtitle: "Writing",
    tagline: "Notes on what I'm building and reading",
    website: "https://thoughts.srujanyamali.com",
    description:
      "An open notebook where I write about engineering and research, mostly about the problems I keep coming back to.",
  },
];

export const ventures = [
  {
    name: "Stryda",
    subtitle: "AI Golf Commissioner",
    tagline: "The AI commissioner for your foursome",
    stack: "Python, TypeScript, React, AI",
    website: "https://stryda.ai",
    description:
      "Runs the round. Holds the line on bets. Settles Venmo before you reach the parking lot. One shared scorecard. Every press remembered. Just play.",
  },
  {
    name: "Sylor",
    subtitle: "AI Simulation Platform",
    tagline: "Stress-test your decisions with AI agents",
    stack: "Next.js, TypeScript, FastAPI, Firebase",
    github: "https://github.com/Srujyama/sylor",
    website: "https://sylor.us",
    description:
      "Multi-agent AI platform that simulates market, pricing, and competitive dynamics so founders can pressure-test decisions before committing.",
  },
  {
    name: "Stryier",
    subtitle: "AI Governance Platform",
    tagline: "Guardrails for shipping AI you can trust",
    stack: "Python, TypeScript, Astro, Docker",
    github: "https://github.com/Srujyama/Stryier",
    description:
      "AI governance platform for monitoring, policy enforcement, and oversight across AI systems — a pivot in the Stryda lineage.",
  },
  {
    name: "M&A Toolkit",
    subtitle: "Sell-Side Deal Flow",
    tagline: "From a data room to a CIM, automatically",
    stack: "Python, TypeScript, Astro, Docker",
    github: "https://github.com/Srujyama/mna-toolkit",
    description:
      "End-to-end workflow tool for sell-side M&A and search-fund deal flow that drafts CIMs, teasers, normalized financials, and buyer/comparable lists from a target's documents.",
  },
  {
    name: "Tipsy",
    subtitle: "iPhone Drink Tracker",
    tagline: "The night, itemized",
    website: "https://tipsyy.vercel.app/",
    description:
      "A drink tracker for iPhone. Logging a drink takes two taps, and from that it keeps a running count of calories and spend, paces the night, and helps you get home safe.",
  },
  {
    name: "Tap to Tip",
    subtitle: "iOS Tipping App",
    tagline: "Where Stryda started — tap your phone, leave a tip",
    stack: "Swift, SwiftUI, NFC, Firebase",
    github: "https://github.com/Srujyama/Fintech-Tipping",
    description:
      "NFC-first iOS tipping app with QR fallbacks, tip configuration, and rewards tracking built on SwiftUI and Firebase — the original product the Stryda founders started with.",
  },
];

export const publications = [
  {
    title:
      "High-Throughput Behavioral Assay Unveils Female Courtship in Drosophila",
    authors: ["R. Oliver", "S. Yamali", "S. Knox", "T. Dadyala", "L. Shao"],
    venue: "International Behavioral and Neural Genetics Society",
    location: "Western University, London",
    year: "2024",
  },
  {
    title:
      "High-Throughput Behavioral Assay Unveils Female Courtship in Drosophila",
    authors: ["R. Oliver", "S. Yamali", "S. Knox", "T. Dadyala", "L. Shao"],
    venue: "Sexually Dimorphic Circuits and Behaviors",
    location: "Janelia Research Campus, HHMI, Ashburn, VA",
    year: "2024",
  },
  {
    title:
      "Redcarpet: Rapid Recombination Detection in Staphylococcus aureus and Other Species Amid Expanding Genomic Databases",
    authors: [
      "A. Moustafa",
      "E. Theiller",
      "A. Lal",
      "S. Yamali",
      "A. Feder",
      "A. Narechania",
      "P. Planet",
    ],
    venue:
      "19th International Symposium on Staphylococci and Staphylococcal Infections",
    location: "Perth",
    year: "2024",
  },
];

// One entry per presentation. These were merged by title for a while, which
// collapsed the two Drosophila venues into a single record and undercounted the
// work; the venue list stays an array so the rendering code is unchanged.
export const publicationWorks = publications.map((p) => ({
  title: p.title,
  authors: p.authors,
  year: p.year,
  venues: [{ venue: p.venue, location: p.location }],
}));

// The research record: the actual output of the lab work rather than a
// description of it. Grouped by `project` on the page. Every `file` is a real
// artifact in public/.
export const research = [
  {
    title: "Where a fly walks, before and after mating",
    kind: "Figure",
    year: "2024",
    project: "drosophila",
    caption:
      "Percent of time spent in the centre of the arena, for wild-type (CS) and Corazonin-mutant (CRZ) flies, before mating (a, b) and after (c, d). A fly that avoids the open middle is showing centrophobism, which is the standard read-out for anxiety-like behaviour in the assay. The CRZ post-mating drop in panel c is the result the study is about.",
    file: "/work/centrophobism-groups.png",
    feature: true,
  },
  {
    title: "Latency against time in the centre",
    kind: "Figure",
    year: "2024",
    project: "drosophila",
    caption:
      "How long a pair took to begin mating, plotted against how much of that time the female spent in the centre. Flat for wild-type, negative for the Corazonin mutants.",
    file: "/work/centrophobism-latency.png",
  },
  {
    title: "Impact of mating on thigmotaxis and centrophobism",
    kind: "Poster",
    year: "2024",
    project: "drosophila",
    caption:
      "The poster version of the study, with the full design, the statistics and the conclusions on one sheet.",
    file: "/work/centrophobism-poster.pdf",
    meta: "PDF",
  },
  {
    title: "S. aureus NCTC8325 similarity matrix with detected regions",
    kind: "Figure",
    year: "2025",
    project: "redcarpet",
    caption:
      "The 2,630-protein similarity matrix for S. aureus NCTC8325. Proteins are ordered along the genome, so a run of proteins that share a history shows up as a bright block on the diagonal. The cyan lines are the eleven changepoints the detector placed at the region boundaries.",
    file: "/work/redcarpet-nctc-heatmap.jpg",
    feature: true,
  },
  {
    title: "Reading the matrix as a one-dimensional signal",
    kind: "Figure",
    year: "2025",
    project: "redcarpet",
    caption:
      "Collapsing the matrix along the genome gives a profile, and the changepoints are the places where that profile shifts. Everything downstream works on this instead of the full matrix, which is what makes it fast enough to run on whole collections.",
    file: "/work/redcarpet-nctc-profile.png",
  },
  {
    title: "What recombination looks like in the data",
    kind: "Figure",
    year: "2025",
    project: "redcarpet",
    caption:
      "Recombination moves a block of DNA from a donor genome into a recipient. That block then co-occurs with a different set of database genomes than the rest of the chromosome does, and that difference is the whole signal the method is built on.",
    file: "/work/redcarpet-recombination.png",
  },
  {
    title: "Anatomy of a carpet",
    kind: "Figure",
    year: "2025",
    project: "redcarpet",
    caption:
      "A recombinant stretch reads as a band that is dim against the core genome but bright within itself. This figure is the reference I used to explain what the detector is looking for before showing it running.",
    file: "/work/redcarpet-anatomy.png",
  },
  {
    title: "Pipeline",
    kind: "Figure",
    year: "2025",
    project: "redcarpet",
    caption:
      "The Snakemake workflow, from genome in to region calls out. Making it a workflow rather than a set of scripts is what let other people in the lab run it without me.",
    file: "/work/redcarpet-pipeline.png",
  },
  {
    title: "Runtime and memory against genome size",
    kind: "Figure",
    year: "2025",
    project: "redcarpet",
    caption:
      "Measured on genomes up to 5,700 proteins. The rewritten matrix engine is 27× faster than the original and produces byte-identical output, which is the only reason it was safe to swap in.",
    file: "/work/redcarpet-scale.png",
  },
  {
    title: "Carpet Change Catcher — methods writeup",
    kind: "Document",
    year: "2025",
    project: "redcarpet",
    caption:
      "Twenty-one pages working through the detection method from the similarity definition to the penalty selection, written so the next person on the project does not have to re-derive it.",
    file: "/work/carpet-change-catcher-methods.pdf",
    meta: "PDF · 21 pages",
  },
];

// The two lines of research, with the biology stated rather than assumed. The
// research page renders these as its section headers.
export const researchProjects = [
  {
    key: "drosophila",
    title: "Measuring behaviour in Drosophila",
    lab: "Behavioural genetics",
    years: "2023 – 2024",
    body: [
      "Courtship in Drosophila is a fixed sequence. The male orients toward the female, taps her, extends one wing and vibrates it into a song, licks, and attempts to copulate. How long that sequence takes to start and how long it runs are the numbers a behavioural study is built on, and for decades they were obtained by a person watching video and pressing a key. A trained scorer manages a handful of pairs per hour, so the size of a study is set by how much of a person's time it can buy rather than by the biology. I built the computer vision that reads the same events off the video directly.",
      "The tracking made a second question askable. A fly in an open arena tends to hug the wall and avoid the middle, and how much it avoids the middle is the standard read-out for anxiety-like behaviour. Because the tracker already knew where every fly was in every frame, I could ask whether mating changes that, and whether Corazonin, a neuropeptide tied to stress response, is involved. It does, and the effect shows up only after mating and only in the mutants.",
    ],
  },
  {
    key: "redcarpet",
    title: "Finding recombination in bacterial genomes",
    lab: "Children's Hospital of Philadelphia · Moustafa & Planet labs",
    years: "2024 – 2025",
    body: [
      "Bacteria do not only inherit their genomes down the family tree. They also take DNA from each other, and a block that arrived that way carries the history of wherever it came from rather than the history of the chromosome it now sits in. Working out which stretches arrived that way is how you tell whether a resistance gene spread by descent or by transfer.",
      "RedCarpet finds those stretches without aligning anything. For every protein it asks which genomes in the database contain something similar, then compares those genome sets between proteins. Proteins that share a history share a set, so ordering the proteins along the chromosome turns the comparison into a signal, and a recombined block shows up as a stretch where that signal shifts. Detecting the shifts is a changepoint problem, and the figures below are the detector running on S. aureus NCTC8325.",
    ],
  },
];

export const citationFor = (work, venue) =>
  `${work.authors.join(", ")} (${work.year}). ${work.title}. ${venue.venue}, ${venue.location}.`;
