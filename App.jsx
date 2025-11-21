import './App.css'
import 'react-vertical-timeline-component/style.min.css'
import { useEffect, useMemo, useState } from 'react'
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component'
import { FileText, Download, Github, ExternalLink, BookOpen } from "lucide-react"

/* ────────────────────────────────────────────────────────────────────────── */
/* Minimal UI components (no libs)                                           */
/* ────────────────────────────────────────────────────────────────────────── */
function Card({ children, className = "", style = {} }) {
    const base = {
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        boxShadow: 'var(--shadow-1)',
        padding: '18px',
        transition: 'transform var(--dur-3) var(--ease), box-shadow var(--dur-3) var(--ease), border-color var(--dur-2) var(--ease)',
    }
    return (
        <article
            className={className}
            style={base}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)'; e.currentTarget.style.borderColor = 'rgba(0,255,255,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-1)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
            {children}
        </article>
    )
}
function CardHeader({ children }) { return <div style={{ marginBottom: 8 }}>{children}</div> }
function CardTitle({ children, className = "" }) { return <h3 className={className} style={{ margin: 0, fontSize: '1.15rem', color: 'var(--fg)' }}>{children}</h3> }
function CardDescription({ children }) { return <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.9rem' }}>{children}</p> }
function CardContent({ children, className = "" }) { return <div className={className} style={{ display: 'grid', gap: 10 }}>{children}</div> }
function CardFooter({ children, className = "" }) { return <div className={className} style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>{children}</div> }

function Badge({ children }) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '4px 8px',
                fontSize: '.75rem',
                fontWeight: 600,
                color: 'var(--fg)',
                background: 'rgba(255,255,255,0.04)',
            }}
        >
      {children}
    </span>
    )
}


/* ────────────────────────────────────────────────────────────────────────── */
/* Links                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */
const highlightLinks = [
    { label: '/resume',       href: '#resume'       },
    { label: '/projects',     href: '#projects'     },
    { label: '/papers', href: '#papers' },
    { label: '/stack', href: '#stack' }
]

const socialLinks = [
    { img: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', alt: 'LinkedIn', href: 'https://linkedin.com/in/srujanyamali' },
    { img: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',   alt: 'GitHub',   href: 'https://github.com/Srujyama' },
    { img: 'https://cdn-icons-png.flaticon.com/512/561/561127.png', alt: 'Email',    href: 'mailto:srujanyamali@berkeley.edu' },
]

/* ────────────────────────────────────────────────────────────────────────── */
/* Projects (2)                                                              */
/* ────────────────────────────────────────────────────────────────────────── */
const projectsData = [
    {
        name: "DrosophilaCV",
        title: "Real-Time Behavioral Detection & Tracking",
        description:
            "End-to-end tool with OpenCV + PyQt6 for tracking mating / thigmotaxis behavior. Processed a 730 GB dataset; >90% manual time saved.",
        stack: ["Python", "OpenCV", "PyQt6", "NumPy", "Pandas"],
        links: [
            { label: "GitHub", href: "https://github.com/Srujyama/FlyFlirt", icon: <Github size={16} /> },
            { label: "Abstract", href: "https://www.ibangs.org/assets/documents/IBANGS%20Annual%20Meeting%202024_%20Genes%2C%20Brain%20and%20Behavior.pdf", icon: <ExternalLink size={16} /> },
        ],
        next: [
            "Plugin system for custom classifiers",
            "Parquet export + built-in visualization dashboard",
            "Cross-platform binaries (Win/macOS/Linux)",
        ],
    },
    {
        name: "RedCarpet",
        title: "Genomic Changepoint Heat-Map Engine",
        description:
            "Changepoint detection across large sequences with clustering and batch heatmaps; parallelized and built for scale.",
        stack: ["Python", "ruptures", "NumPy", "SciPy", "scikit-learn", "Matplotlib"],
        links: [
            { label: "GitHub", href: "https://github.com/microbialARC/Redcarpet", icon: <Github size={16} /> },
            { label: "Abstract", href: "https://icmsmeetings.eventsair.com/isssi-2024/speakers", icon: <ExternalLink size={16} /> },
        ],
        next: [
            "CLI (detect, cluster, visualize)",
            "HDF5/TileDB backing for 10k+ genomes",
            "Bayesian segment merging + QC report",
        ],
    },
]

/* ────────────────────────────────────────────────────────────────────────── */
/* Publications & Awards data                                                */
/* ────────────────────────────────────────────────────────────────────────── */
const papersData = [
    {
        authors: "R. Oliver, S. Yamali, S. Knox, T. Dadyala, L. Shao",
        title: "High-Throughput Behavioral Assay Unveils Female Courtship Behaviors in Drosophila",
        venue: "International Behavioral & Neural Genetics Society (IBANGS), Western University, London, ON, Canada",
        year: "2024",
        links: [
            { label: "Abstract", href: "https://www.ibangs.org/assets/documents/IBANGS%20Annual%20Meeting%202024_%20Genes%2C%20Brain%20and%20Behavior.pdf" }
        ]
    },
    {
        authors: "R. Oliver, S. Yamali, S. Knox, T. Dadyala, L. Shao",
        title: "High-Throughput Behavioral Assay Unveils Female Courtship Behaviors in Drosophila",
        venue: "Sexually Dimorphic Circuits & Behaviors, Janelia Research Campus (HHMI), Ashburn, VA",
        year: "2024",
        links: []
    },
    {
        authors: "A. Moustafa, E. Theiller, A. Lal, S. Yamali, A. Feder, A. Narechania, P. Planet",
        title: "Redcarpet: A Tool for Rapid Recombination Detection in Staphylococcus aureus and Other Species Amidst Expanding Genomic Databases",
        venue: "19th International Symposium on Staphylococci and Staphylococcal Infections (ISSSI), Perth, Australia",
        year: "2024",
        links: [
            { label: "Abstract", href: "https://icmsmeetings.eventsair.com/isssi-2024/speakers" },
            { label: "Project", href: "https://github.com/microbialARC/Redcarpet" }
        ]
    }
]

/* ────────────────────────────────────────────────────────────────────────── */
/* Timeline data                                                             */
/* ────────────────────────────────────────────────────────────────────────── */
const timelineData = [
    {
        title: 'Software Engineer Intern',
        org: 'Visa',
        location: 'Remote',
        date: 'Nov 2025 - Present',
        bullets: [
            'Developed internal LLM-powered enterprise automation tools supporting Visa’s risk and product teams.',
            'Designed an AI-generated Statement of Work pipeline helping automate 10,000 client implementation projects annually',
            'Built scalable cloud infrastructure and data ingestion pipelines to support real-time sensor streaming and model execution.',
        ],
        type: 'work',
    },
    {
        title: 'Software Engineer',
        org: 'Mercor',
        location: 'Remote',
        date: 'Aug 2025 - Present',
        bullets: [
            'Automated multimodal data ingestion, fine-tuning, and continuous deployment pipelines using Prefect, MLflow, and\n' +
            'Kubernetes clusters—reducing enterprise experiment-to-production cycle time by 40%.',
            'Engineered enterprise-scale AI/ML developer tooling powering model evaluation, safety benchmarking, and data labeling\n' +
            'workflows across top AI labs production environments',
            'Designed and implemented internal developer tooling to accelerate AI/ML workflow automation.',
        ],
        type: 'work',
    },
    {
        title: 'Bachelors in Computer Science',
        org: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        date: 'Aug 2025 – May 2027',
        bullets: [
            'Coursework: Machine Learning, Data Structures, Algorithms, Linear Algebra, Calculus, Differential Equations',
        ],
        type: 'education',
    },
    {
        title: 'Machine Learning Engineer Intern',
        org: 'Cornell University - Hein Lab',
        location: 'Remote',
        date: 'Mar 2024 – Aug 2024',
        bullets: [
            'Applied YOLO-based object detection to automate identification and tracking of fish behaviors under predation, achieving\n' +
            '85%+ accuracy across 500+ hours of field video footage of behaviors with little discrepancy of each other.',
            'Applied deep learning techniques, including YOLO-based object detection, to automate the identification and tracking of\n' +
            'individual and group fish behaviors due to predation from field video data.',
            'Assisted in inferring decision-making rules via stochastic models.',
        ],
        type: 'work',
    },
    {
        title: 'Data Science Intern',
        org: "Children’s Hospital of Philadelphia - Moustafa Lab",
        location: 'Philadelphia, PA',
        date: 'Nov 2023 – Aug 2025',
        bullets: [
            'Designed program to analyze evolutionary relationships in bacterial proteomic data using time-series analysis and data structures.',
            'Integrated kernel-based probabilistic changepoint analysis to identify recombination breakpoints across 75,000+ genomes (~37TB).',
            'Developed a parallelized framework with Python multiprocessing, enabling large-scale genomic region analysis and\n' +
            'accelerating runtime through statistical comparisons and clustering logic.',
        ],
        type: 'work',
    },
    {
        title: 'Software Development Intern',
        org: 'University of Delaware - Shao Lab',
        location: 'Newark, DE',
        date: 'Jun 2023 – Aug 2024',
        bullets: [
            'Developed a PyQt6/OpenCV application to automate analysis of 730 GB of Drosophila video, reducing manual annotation\n' +
            'time by 90% and saving hundreds of hours; Delivered automated tracking of behaviors impossible to detect manually.',
            'Built an ROI-tracking engine using blob tracking and centroid calculations to monitor behavioral dynamics, achieving 99.7%\n' +
            'accuracy in mating trial analysis, streaming real-time signals to a GUI overlay for behavior classification and role tracking.',
            'Investigated NPF signaling and reward perception; explored reduction of addiction.',
            'Built high-throughput thigmotaxis capture/analysis pipeline for anxiety-modeling studies.',
        ],
        type: 'work',
    },
    {
        title: 'Research Assistant',
        org: 'Perelman School of Medicine - Gupta Lab',
        location: 'Philadelphia, PA',
        date: 'Jul 2023 – Aug 2023',
        bullets: [
            'Protein purification/crystallization; SDS-PAGE & Western blot validation.',
            'Cell cultures using inverse PCR for point mutation in E. coli.',
            'Assisted X-ray crystallography data collection/analysis.',
        ],
        type: 'work',
    },
]

/* ────────────────────────────────────────────────────────────────────────── */
/* Matrix + cells                                                            */
/* ────────────────────────────────────────────────────────────────────────── */
const symbols = ['6.626', '1.618', '2.718', '3.141']
const randIndex = () => Math.floor(Math.random() * symbols.length)

function MatrixCell({ isHighlight, label, href, style }) {
    const [value, setValue] = useState(() => symbols[randIndex()])

    useEffect(() => {
        if (!isHighlight) {
            const id = setInterval(() => {
                setValue(symbols[randIndex()])
            }, 1500 + Math.random() * 1500)
            return () => clearInterval(id)
        }
    }, [isHighlight])

    const className = isHighlight ? 'grid-item highlight fade-in' : 'grid-item fade-in'

    return isHighlight ? (
        <a
            href={href}
            className={className}
            style={style}
            aria-label={`Jump to ${label.replace('/', '')} section`}
            role="gridcell"
        >
            {label}
        </a>
    ) : (
        <div
            className={className}
            style={style}
            role="presentation"
            aria-hidden="true"
        >
            {value}
        </div>
    )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Timeline                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
function ResumeTimeline() {
    const getLogoForItem = (item) => {
        const org = item.org.toLowerCase()
        if (
            org.includes('perelman') ||
            org.includes("children’s hospital of philadelphia") ||
            org.includes("children's hospital of philadelphia")
        ) return '/UniversityofPennsylvania_Shield_RGB-2.png'
        if (org.includes('cornell')) return '/Cornell_University_seal.png'
        if (org.includes('princeton')) return '/Princeton_seal.png'
        if (org.includes('berkeley')) return '/Seal_of_University_of_California_Berkeley.png'
        if (org.includes('delaware')) return '/Udel.png'
        if (org.includes('mercor')) return '/Mercor_Logo.png'
        if (org.includes('visa')) return '/visa.png'
        return null
    }

    const palette = {
        work: {
            iconBg: 'rgba(255,255,255,0.45)',
            iconBorder: '1px solid rgba(14,165,233,0.45)',
            contentBg: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(14,165,233,0.06))',
            contentBorder: '1px solid rgba(14,165,233,0.25)',
            accent: '#0ea5e9',
        },
        education: {
            iconBg: 'rgba(255,255,255,0.45)',
            iconBorder: '1px solid rgba(34,197,94,0.45)',
            contentBg: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(34,197,94,0.06))',
            contentBorder: '1px solid rgba(34,197,94,0.25)',
            accent: '#22c55e',
        },
    }

    return (
        <VerticalTimeline lineColor="rgba(255,255,255,0.18)" layout="1-column-left">
            {timelineData.map((item, i) => {
                const c = palette[item.type] ?? palette.work
                const logo = getLogoForItem(item)
                const initials = item.org.replace(/·.+$/, '').match(/\b[A-Z]/g)?.slice(0,3).join('') || '•'

                return (
                    <VerticalTimelineElement
                        key={i}
                        icon={
                            <div className="vt-icon-inner" aria-hidden="true">
                                {logo ? (
                                    <img src={logo} alt={`${item.org} logo`} className="vt-logo" width="32" height="32" loading="lazy" decoding="async" />
                                ) : (
                                    <span className="vt-initials">{initials}</span>
                                )}
                            </div>
                        }
                        iconStyle={{
                            background: c.iconBg,
                            backdropFilter: 'blur(6px)',
                            color: '#fff',
                            borderRadius: 12,
                            border: c.iconBorder,
                        }}
                        contentStyle={{
                            background: c.contentBg,
                            color: 'var(--fg)',
                            border: c.contentBorder,
                            borderRadius: 14,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                        }}
                        contentArrowStyle={{ borderRight: '7px solid rgba(255,255,255,0.06)' }}
                    >
                        <div className="vt-toprow">
              <span className="vt-badge" style={{ borderColor: c.accent, color: c.accent }}>
                {item.type === 'education' ? 'Education' : 'Experience'}
              </span>
                            <span className="vt-date">{item.date}</span>
                        </div>

                        <h3 className="vt-title">{item.title}</h3>

                        <div className="vt-orgline">
              <span className="vt-org" style={{ background: `linear-gradient(90deg, ${c.accent}33, transparent)` }}>
                {item.org}{item.location ? ` · ${item.location}` : ''}
              </span>
                        </div>

                        <ul className="vt-list">
                            {item.bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                        </ul>
                    </VerticalTimelineElement>
                )
            })}
        </VerticalTimeline>
    )
}


function ProjectsSection() {
    return (
        <section id="projects" className="section projects-terminal-section">
            <header className="resume-header">
                <h2 className="resume-title">Projects</h2>
                <p className="resume-sub">
                    Run logs from tools I’ve actually built and shipped
                </p>
                <div className="resume-divider" />
            </header>

            <div className="projects-terminal">
                {projectsData.map((p, idx) => {
                    // generate a fake CLI-ish command from the project name
                    const slug = p.name
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, '')

                    const isResearchy =
                        p.stack.includes("OpenCV") ||
                        p.stack.includes("NumPy") ||
                        p.stack.includes("Pandas") ||
                        p.stack.includes("ruptures")

                    return (
                        <article key={idx} className="proj-session">
                            {/* Session header bar */}
                            <div className="proj-session-bar">
                                <div className="proj-session-dots" aria-hidden="true">
                                    <span className="proj-dot dot-red" />
                                    <span className="proj-dot dot-amber" />
                                    <span className="proj-dot dot-green" />
                                </div>
                                <span className="proj-session-label">
                  session-{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                    {isResearchy ? " · research" : " · engineering"}
                </span>
                            </div>

                            {/* Terminal body */}
                            <div className="proj-terminal-body">
                                <div className="proj-line">
                                    <span className="proj-prompt">$</span>
                                    <span className="proj-command">
                    run {slug}
                                        {isResearchy ? " --analyze" : " --deploy"}
                  </span>
                                </div>

                                <div className="proj-line proj-line-meta">
                                    <span className="proj-meta-key">[title]</span>
                                    <span className="proj-meta-value">{p.title}</span>
                                </div>

                                <div className="proj-line proj-line-meta">
                                    <span className="proj-meta-key">[alias]</span>
                                    <span className="proj-meta-value">{p.name}</span>
                                </div>

                                <div className="proj-line proj-line-meta">
                                    <span className="proj-meta-key">[summary]</span>
                                    <span className="proj-meta-value">{p.description}</span>
                                </div>

                                {/* Stack block */}
                                <div className="proj-block">
                                    <div className="proj-block-header">
                                        <span className="proj-block-tag">[stack]</span>
                                        <span className="proj-block-sub">
                      {isResearchy ? "analysis · tooling" : "infra · product"}
                    </span>
                                    </div>
                                    <div className="proj-stack-row">
                                        {p.stack.map((tech) => (
                                            <span key={tech} className="proj-chip">
                        {tech}
                      </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Next up block */}
                                {p.next?.length ? (
                                    <div className="proj-block">
                                        <div className="proj-block-header">
                                            <span className="proj-block-tag">[next]</span>
                                            <span className="proj-block-sub">planned extensions</span>
                                        </div>
                                        <ul className="proj-next-list">
                                            {p.next.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {/* Links block */}
                                {p.links?.length ? (
                                    <div className="proj-block proj-links-block">
                                        <div className="proj-block-header">
                                            <span className="proj-block-tag">[links]</span>
                                            <span className="proj-block-sub">source · artifact</span>
                                        </div>
                                        <div className="proj-links-row">
                                            {p.links.map((l, i) => (
                                                <a
                                                    key={i}
                                                    href={l.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="proj-link-chip"
                                                >
                                                    {l.icon}
                                                    <span>{l.label}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Status line */}
                                <div className="proj-line proj-line-status">
                                    <span className="proj-status-dot" />
                                    <span className="proj-status-text">
                    exit code 0 · {isResearchy ? "validated on real data" : "ready for users"}
                  </span>
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}


/* ────────────────────────────────────────────────────────────────────────── */
/* Publications & Honors sections                                            */
/* ────────────────────────────────────────────────────────────────────────── */
function PapersSection() {
    return (
        <section id="papers" className="section dossier-section">
            <header className="resume-header">
                <h2 className="resume-title">Publications & Conferences</h2>
                <p className="resume-sub">Filed research dossiers</p>
                <div className="resume-divider" />
            </header>

            <div className="dossier-grid">
                {papersData.map((p, idx) => {
                    const shortYear = String(p.year).slice(-2)
                    const docNumber = `${shortYear}${(idx + 1).toString().padStart(2, "0")}`

                    const lowerTitle = p.title.toLowerCase()
                    let field = "Computational Biology"
                    if (lowerTitle.includes("drosophila")) field = "Behavioral Genetics"
                    if (lowerTitle.includes("recombination") || lowerTitle.includes("staphylococcus"))
                        field = "Genomics / Microbiology"

                    const level = idx === 0 ? "BLACKSITE ACCESS" : "CONFERENCE BRIEF"

                    return (
                        <article key={idx} className="dossier-card">
                            {/* Top strip */}
                            <header className="dossier-header">
                                <div className="dossier-header-left">
                                    <span className="dossier-doc-id">DOC-{docNumber}</span>
                                    <span className="dossier-doc-label">CLASSIFIED RESEARCH DOSSIER</span>
                                </div>
                                <div className="dossier-header-right">
                                    <span className="dossier-field">{field}</span>
                                    <span className="dossier-level">{level}</span>
                                </div>
                            </header>

                            <div className="dossier-rule" aria-hidden="true" />

                            {/* Title block */}
                            <div className="dossier-title-block">
                                <h3 className="dossier-title">{p.title}</h3>
                                <div className="dossier-year-stamp">
                                    <span className="dossier-year">{p.year}</span>
                                </div>
                            </div>

                            {/* Authors / venue */}
                            <div className="dossier-meta">
                                <div className="dossier-meta-row">
                                    <span className="dossier-meta-label">Authors</span>
                                    <span className="dossier-meta-value">{p.authors}</span>
                                </div>
                                <div className="dossier-meta-row">
                                    <span className="dossier-meta-label">Venue</span>
                                    <span className="dossier-meta-value">{p.venue}</span>
                                </div>
                            </div>

                            {/* Fake synopsis + redacted strip */}
                            <div className="dossier-body">
                                <div className="dossier-section-label">Synopsis</div>
                                <p className="dossier-synopsis">
                                    High-level summary of experimental design, results, and implications
                                    filed under this entry. Detailed figures, statistics, and extended
                                    methods are archived in the primary record.
                                </p>

                                <div className="dossier-redacted-block" aria-hidden="true">
                                    <span className="dossier-redacted-label">REDACTED UNTIL FULL PUBLICATION</span>
                                    <div className="dossier-redacted-bar" />
                                </div>
                            </div>

                            {/* Links */}
                            {p.links?.length ? (
                                <footer className="dossier-footer">
                                    <div className="dossier-section-label">Access</div>
                                    <div className="dossier-links-row">
                                        {p.links.map((l, i) => (
                                            <a
                                                key={i}
                                                href={l.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="dossier-link-btn"
                                            >
                                                <ExternalLink size={14} />
                                                <span>{l.label}</span>
                                            </a>
                                        ))}
                                    </div>
                                </footer>
                            ) : null}
                        </article>
                    )
                })}
            </div>
        </section>
    )
}


// === IDEA 1: METRO MAP STACK SECTION ===
function StackSection() {
    const lines = [
        {
            name: "Languages & Core",
            color: "#22d3ee",
            note: "day-to-day programming languages",
            tools: ["Python", "JavaScript", "C/C++", "Rust", "Java", "SQL", "HTML/CSS"],
        },
        {
            name: "Web & Frameworks",
            color: "#a855f7",
            note: "full-stack and web app frameworks",
            tools: ["Node.js", "React", "Flask", "Django", "Tailwind CSS"],
        },
        {
            name: "Cloud & Infra",
            color: "#34d399",
            note: "deploying, scaling, and operating services",
            tools: [
                "AWS (S3, EC2, RDS)",
                "GCP",
                "Azure",
                "Linux",
                "Docker",
                "Kubernetes",
                "Git",
                "REST API",
            ],
        },
        {
            name: "Data & Storage",
            color: "#f97316",
            note: "databases, querying, and analytics",
            tools: ["MySQL", "PostgreSQL", "SQLAlchemy", "NumPy", "Pandas"],
        },
        {
            name: "AI / ML",
            color: "#e11d48",
            note: "modeling, vision, and LLM tooling",
            tools: ["PyTorch", "TensorFlow", "Scikit-Learn", "OpenCV", "LangChain", "PineconeDB"],
        },
    ]

    return (
        <section id="stack" className="section stack-metro-section">
            <header className="resume-header">
                <h2 className="resume-title">Tech Stack</h2>
                <p className="resume-sub">Mapped like a subway of what I actually use</p>
                <div className="resume-divider" />
            </header>

            {/* Metro map overview */}
            <div className="stack-metro">
                {lines.map((line) => (
                    <div className="stack-line" key={line.name}>
                        <div className="stack-line-label">
                            <div className="stack-line-dot" style={{ backgroundColor: line.color }} />
                            <div>
                                <div className="stack-line-name">{line.name}</div>
                                <div className="stack-line-note">{line.note}</div>
                            </div>
                        </div>

                        <div className="stack-line-track">
                            <div
                                className="stack-line-rail"
                                style={{ background: `${line.color}55` }}
                                aria-hidden="true"
                            />
                            <div className="stack-line-stations">
                                {line.tools.map((tool) => (
                                    <span
                                        key={tool}
                                        className="stack-station"
                                        style={{
                                            borderColor: `${line.color}aa`,
                                            boxShadow: `0 4px 12px ${line.color}55`,
                                        }}
                                    >
                      <span
                          className="stack-station-bullet"
                          style={{ backgroundColor: line.color }}
                      />
                                        {tool}
                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Animated pipeline: how the stack actually flows */}
            <div className="stack-flow">
                <div className="stack-flow-header">
                    <span className="stack-flow-title">How it all runs</span>
                    <span className="stack-flow-sub">
            requests flowing from UI → APIs → data → models → cloud
          </span>
                </div>

                <div className="stack-flow-diagram">
                    <div className="stack-flow-node node-client">
                        <div className="stack-flow-label">Client</div>
                        <div className="stack-flow-tools">React · JS · HTML/CSS</div>
                    </div>

                    <div className="stack-flow-node node-api">
                        <div className="stack-flow-label">API / Services</div>
                        <div className="stack-flow-tools">Node.js · Flask · Django</div>
                    </div>

                    <div className="stack-flow-node node-data">
                        <div className="stack-flow-label">Data Layer</div>
                        <div className="stack-flow-tools">PostgreSQL · MySQL · Pandas</div>
                    </div>

                    <div className="stack-flow-node node-ml">
                        <div className="stack-flow-label">Models</div>
                        <div className="stack-flow-tools">PyTorch · TensorFlow · OpenCV</div>
                    </div>

                    <div className="stack-flow-node node-cloud">
                        <div className="stack-flow-label">Cloud / Infra</div>
                        <div className="stack-flow-tools">AWS · GCP · Docker · K8s</div>
                    </div>

                    {/* moving "packets" */}
                    <div className="stack-flow-packet packet-1" />
                    <div className="stack-flow-packet packet-2" />
                    <div className="stack-flow-packet packet-3" />
                </div>
            </div>
        </section>
    )
}



/* ────────────────────────────────────────────────────────────────────────── */
/* App                                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
export default function App() {
    const positionsToLinks = useMemo(() => {
        const map = new Map()
        ;[26, 33, 77, 84].forEach((pos, i) => map.set(pos, highlightLinks[i]))
        return map
    }, [])

    const gridItems = useMemo(() => {
        return Array.from({ length: 144 }, (_, i) => {
            const link = positionsToLinks.get(i) || null
            const row = Math.floor(i / 12)
            const col = i % 12
            const delay = (row + col) * 100
            return (
                <MatrixCell
                    key={i}
                    isHighlight={!!link}
                    label={link?.label}
                    href={link?.href}
                    style={{ animationDelay: `${delay}ms` }}
                />
            )
        })
    }, [positionsToLinks])

    const [showInfo, setShowInfo] = useState(false)

    return (
        <>
            {/* HERO */}
            <section className="hero">
                <div className="matrix-container">
                    <h1 className="matrix-title text-fade-in">Srujan Yamali</h1>
                    <p className="matrix-sub text-fade-in delay-1">CS + Neuro @ UC Berkeley</p>

                    <div className="social-icons" aria-label="Social links">
                        {socialLinks.map((s, idx) => (
                            <a
                                href={s.href}
                                key={idx}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={s.alt}
                                referrerPolicy="no-referrer"
                            >
                                <img
                                    src={s.img}
                                    alt=""
                                    className="icon"
                                    width="32"
                                    height="32"
                                    loading="lazy"
                                    decoding="async"
                                    aria-hidden="true"
                                />
                            </a>
                        ))}
                    </div>

                    <div className="matrix-grid" role="grid" aria-label="Matrix navigation grid">
                        {gridItems}
                    </div>

                    <button
                        className="info-button fade-in"
                        onClick={() => setShowInfo(prev => !prev)}
                        aria-expanded={showInfo}
                        aria-controls="numbers-meaning"
                    >
                        {showInfo ? 'Hide' : 'What do the numbers mean?'}
                    </button>

                    <div
                        id="numbers-meaning"
                        className="info-panel"
                        style={{
                            maxHeight: showInfo ? '60vh' : 0,
                            opacity: showInfo ? 1 : 0,
                            transform: showInfo ? 'translateY(0)' : 'translateY(8px)',
                            pointerEvents: showInfo ? 'auto' : 'none',
                        }}
                    >
                        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                            <li><b>6.626</b> — Planck's constant (<i>h</i>).</li>
                            <li><b>1.618</b> — Golden ratio (φ).</li>
                            <li><b>2.718</b> — Euler’s number (<i>e</i>).</li>
                            <li><b>3.141</b> — π (pi).</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* RESUME */}
            <section id="resume" className="section">
                <header className="resume-header">
                    <h2 className="resume-title">Resume</h2>
                    <p className="resume-sub">Experience, research, and education</p>
                    <div className="resume-divider" />
                </header>

                <div className="resume-actions">
                    <a
                        href="/SrujanYamaliResume.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resume-btn"
                    >
                        <FileText className="resume-icon" aria-hidden="true" />
                        <span>View</span>
                    </a>
                    <a
                        href="/SrujanYamaliResume.pdf"
                        download
                        className="resume-btn"
                    >
                        <Download className="resume-icon" aria-hidden="true" />
                        <span>Download</span>
                    </a>
                </div>

            <ResumeTimeline />
            </section>

            {/* PROJECTS */}
            <ProjectsSection />


            {/* TECH STACK */}
            <StackSection />

            {/* PUBLICATIONS */}
            <PapersSection />

        </>
    )
}
