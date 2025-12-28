// App.jsx
import "./style.css";
import { useEffect, useMemo, useRef, useState } from "react";

function useClock(ms = 40) {
    const [t, setT] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setT((v) => v + 1), ms);
        return () => clearInterval(id);
    }, [ms]);

    return t;
}

function Pattern() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid-warp"
        />
    );
}


function Noise() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-multiply"
            style={{
                backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
            }}
        />
    );
}

function Section({ title, hint, children, open, onToggle }) {
    return (
        <div className="border-l border-black/20 pl-4">
            <button
                type="button"
                onClick={onToggle}
                className="w-full py-3 flex items-center justify-between gap-4 text-left"
            >
                <div>
                    <div className="text-sm font-semibold text-black">{title}</div>
                    {hint ? <div className="text-xs text-black/55 mt-0.5">{hint}</div> : null}
                </div>
                <div className="text-xs text-black/45">{open ? "—" : "+"}</div>
            </button>

            <div
                className={`grid transition-all duration-200 ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden pb-4">{children}</div>
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children }) {
    const closeBtnRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeBtnRef.current?.focus();

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    // Not a “box”: just a blurred sheet with no border/shadow/rounding.
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[3px]" onClick={onClose} />
            <div className="absolute inset-x-0 top-0 bottom-0 overflow-auto">
                <div className="mx-auto w-[min(1000px,94vw)] py-8">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <div className="text-sm font-semibold text-black">{title}</div>
                            <div className="text-xs text-black/55 mt-1">All my work</div>
                        </div>
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={onClose}
                            className="text-xs text-black/70 hover:text-black underline underline-offset-4"
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-4 border-t border-black/10 pt-5">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    const profile = useMemo(
        () => ({
            name: "Srujan Yamali",
            title: "Software Engineer / Research",
            location: "Berkeley • San Francisco",
            email: "srujanyamali@berkeley.edu",
            site: "", // optional: "srujanyamali.com"
            github: "github.com/srujyama",
            linkedin: "linkedin.com/in/srujanyamali",
        }),
        []
    );

    const education = useMemo(
        () => [
            {
                org: "University of California, Berkeley",
                degree: "B.A. Molecular & Cellular Biology & Computer Science (GPA 4.0)",
                dates: "Aug 2025 – May 2029",
                extra:
                    "Coursework: ML, AI, Algorithms, Data Structures, Computer Architecture, Discrete Math & Probability, Linear Algebra, Signals & Systems, Circuits & Devices",
            },
        ],
        []
    );

    const experience = useMemo(
        () => [
            {
                org: "Mercor — Software Engineer",
                where: "San Francisco, CA",
                dates: "Aug 2025 – Present",
                bullets: [
                    "Engineered enterprise-scale AI/ML developer tooling for model evaluation, safety benchmarking, and data labeling workflows across production environments.",
                    "Developed LLM API pipeline for mass testing on human data.",
                    "Automated multimodal ingestion, fine-tuning, and continuous deployment using Prefect, MLflow, and Kubernetes, reducing experiment-to-production cycle time ~40%.",
                ],
            },
            {
                org: "Visa — Software Engineer Intern",
                where: "Remote",
                dates: "Nov 2025 – Present",
                bullets: [
                    "Developed internal LLM-powered enterprise automation tools for risk and product teams.",
                    "Designed an AI-generated Statement of Work pipeline to help automate ~10,000 client implementation projects annually.",
                    "Built scalable cloud infrastructure + ingestion pipelines for real-time sensor streaming and model execution.",
                ],
            },
            {
                org: "Children’s Hospital of Philadelphia — Data Science Intern",
                where: "Philadelphia, PA",
                dates: "Sept 2024 – Aug 2025",
                bullets: [
                    "Built a high-performance time-series pipeline for genomic recombination detection (KernelCPD), scaling to 75,000+ genomes (~37TB) using ruptures, KDTree, and multiprocessing.",
                    "Developed parallelized Python framework enabling large-scale region analysis and accelerating runtime via statistical comparisons + clustering logic.",
                ],
            },
            {
                org: "Cornell University — ML Engineer Intern / Research Intern",
                where: "Remote",
                dates: "Sept 2023 – May 2024 / Mar 2024 – Aug 2024",
                bullets: [
                    "Applied YOLO-based object detection to track fish behaviors under predation; 85%+ accuracy across 500+ hours of field video.",
                    "Assisted inference of decision-making rules using stochastic models and dynamic behavioral sequences.",
                ],
            },
            {
                org: "University of Delaware — Software Development Intern / Research Assistant",
                where: "Newark, DE",
                dates: "Jun 2023 – Aug 2023 / Jun 2023 – Aug 2024",
                bullets: [
                    "Built PyQt6/OpenCV app to automate analysis of 730GB of Drosophila video; reduced manual annotation time ~90%.",
                    "Created ROI-tracking engine with blob tracking + centroid logic; ~99.7% accuracy in mating trial analysis with real-time GUI overlays.",
                    "Developed high-throughput capture for thigmotaxis/anxiety behavioral analysis; explored reward perception mechanisms (NPF signaling).",
                ],
            },
            {
                org: "Perelman School of Medicine — Research Trainee",
                where: "Philadelphia, PA",
                dates: "Jul 2023 – Aug 2023",
                bullets: [
                    "Protein purification/crystallization; SDS-PAGE/Western blot validation.",
                    "Cell culturing, bacterial transformation, plasmid prep; assisted X-ray crystallography data collection/analysis.",
                ],
            },
        ],
        []
    );

    const projects = useMemo(
        () => [
            {
                name: "FlyFlirt — Real-Time Behavioral Detection and Tracking",
                stack: "Python, OpenCV, PyQt6, Pandas",
                bullets: [
                    "Production-grade CV pipeline to detect/track Drosophila behaviors across hundreds of hours of video; reduced manual annotation ~90%.",
                    "Real-time OpenCV/NumPy processing for high-throughput experiments with near–zero latency + automated labeling across thousands of frames.",
                ],
            },
            {
                name: "RedCarpet — Genomic Changepoint Heatmap Engine",
                stack: "Python, ruptures, scikit-learn, Matplotlib",
                bullets: [
                    "High-performance changepoint engine using multiprocessing + KDTree similarity search to accelerate recombination discovery.",
                    "Automated comparative visualization via Matplotlib heatmaps for reproducible genomic analysis.",
                ],
            },
        ],
        []
    );

    const publications = useMemo(
        () => [
            {
                citation:
                    "R. Oliver, S. Yamali, S. Knox, T. Dadyala, L. Shao. High-Throughput Behavioral Assay Unveils Female Courtship in Drosophila. Proceedings of the International Behavioral and Neural Genetics Society, Western University, London (2024).",
            },
            {
                citation:
                    "R. Oliver, S. Yamali, S. Knox, T. Dadyala, L. Shao. High-Throughput Behavioral Assay Unveils Female Courtship in Drosophila. Sexually Dimorphic Circuits and Behaviors, Janelia Research Campus, HHMI, Ashburn, VA (2024).",
            },
            {
                citation:
                    "A. Moustafa, E. Theiller, A. Lal, S. Yamali, A. Feder, A. Narechania, P. Planet. Redcarpet: Rapid Recombination Detection in Staphylococcus aureus and other species amid expanding genomic databases. 19th International Symposium on Staphylococci and Staphylococcal Infections, Perth (2024).",
            },
        ],
        []
    );

    const skills = useMemo(
        () => [
            "Python, JavaScript, C/C++, Rust, Java, SQL, HTML/CSS",
            "React, Flask, Django, Node.js, REST APIs",
            "AWS (S3/EC2/RDS), GCP, Azure, Docker, Kubernetes, Linux",
            "NumPy, Pandas, OpenCV, scikit-learn, PyTorch, TensorFlow, HuggingFace",
            "Prefect, MLflow, LangChain, PineconeDB",
            "Lab: PCR, gel electrophoresis, mutagenesis, cell culturing, transformation",
        ],
        []
    );

    const [openKey, setOpenKey] = useState("experience");
    const [modal, setModal] = useState(null);

    const openModal = (key) => setModal(key);
    const closeModal = () => setModal(null);

    const compactList = (items, n = 3) => items.slice(0, n);

    const linkify = (value) => {
        if (!value) return "#";
        if (value.startsWith("http://") || value.startsWith("https://")) return value;
        if (value.includes("@")) return `mailto:${value}`;
        return `https://${value}`;
    };

    return (
        // scrollable page, no “card” containers
        <div className="relative min-h-screen w-full overflow-y-auto bg-white text-black">
            <Pattern />
            <Noise />

            <main className="relative w-full px-6 py-10">
                <section className="mx-auto w-full max-w-6xl">
                    {/* Sticky header (NOT a box): just blur + thin rule */}
                    <div className="sticky top-0 z-20 -mx-6 px-6 backdrop-blur-md">
                        <div className="py-6 border-b border-black/10">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <div className="text-[11px] tracking-[0.22em] text-black/55">
                                        RESEARCH • SYSTEMS • ENGINEERING
                                    </div>
                                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">{profile.name}</h1>
                                    <div className="mt-1 text-sm text-black/70">
                                        {profile.title} · {profile.location}
                                    </div>
                                </div>

                                <div className="text-right text-xs text-black/60 space-y-1">
                                    <div>
                                        <a className="hover:text-black" href={linkify(profile.email)}>
                                            {profile.email}
                                        </a>
                                    </div>

                                    {profile.site ? (
                                        <div>
                                            <a
                                                className="hover:text-black"
                                                href={linkify(profile.site)}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {profile.site}
                                            </a>
                                        </div>
                                    ) : null}

                                    <div>
                                        <a
                                            className="hover:text-black"
                                            href={linkify(profile.github)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {profile.github}
                                        </a>
                                    </div>
                                    <div>
                                        <a
                                            className="hover:text-black"
                                            href={linkify(profile.linkedin)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {profile.linkedin}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-4 text-sm leading-relaxed text-black/75">
                                I build evaluation-grade ML systems: robust pipelines, scalable experimentation, and
                                high-signal measurement.
                            </p>

                            <div className="mt-3 text-[11px] text-black/55 flex items-center justify-between">
                            </div>
                        </div>
                    </div>

                    {/* Body: pure text + separators, NO boxes */}
                    <div className="pt-6 grid gap-3">
                        <Section
                            title="Experience"
                            hint="Software engineering & research roles"
                            open={openKey === "experience"}
                            onToggle={() => setOpenKey(openKey === "experience" ? "" : "experience")}
                        >
                            <div className="space-y-4">
                                {compactList(experience, 3).map((e, idx) => (
                                    <div key={e.org} className="pb-4 border-b border-black/10 last:border-b-0">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <div className="text-sm font-semibold">{e.org}</div>
                                            <div className="text-xs text-black/55">
                                                {e.dates} · {e.where}
                                            </div>
                                        </div>
                                        <ul className="mt-2 text-sm text-black/70 list-disc pl-5 space-y-1">
                                            {e.bullets.slice(0, 2).map((b, i) => (
                                                <li key={i}>{b}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => openModal("experience")}
                                    aria-haspopup="dialog"
                                    aria-expanded={modal === "experience"}
                                    className="text-sm text-black/75 hover:text-black underline underline-offset-4"
                                >
                                    Expand all experience →
                                </button>
                            </div>
                        </Section>

                        <Section
                            title="Education"
                            hint="Berkeley CS + MCB"
                            open={openKey === "education"}
                            onToggle={() => setOpenKey(openKey === "education" ? "" : "education")}
                        >
                            <div className="space-y-4">
                                {education.map((ed) => (
                                    <div
                                        key={`${ed.org}-${ed.degree}`}
                                        className="pb-4 border-b border-black/10 last:border-b-0"
                                    >
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <div className="text-sm font-semibold">{ed.org}</div>
                                            <div className="text-xs text-black/55">{ed.dates}</div>
                                        </div>
                                        <div className="mt-1 text-sm text-black/70">{ed.degree}</div>
                                        {ed.extra ? <div className="mt-2 text-xs text-black/60">{ed.extra}</div> : null}
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section
                            title="Projects"
                            hint="FlyFlirt, RedCarpet"
                            open={openKey === "projects"}
                            onToggle={() => setOpenKey(openKey === "projects" ? "" : "projects")}
                        >
                            <div className="space-y-4">
                                {projects.map((p) => (
                                    <div key={p.name} className="pb-4 border-b border-black/10 last:border-b-0">
                                        <div className="text-sm font-semibold">{p.name}</div>
                                        <div className="text-xs text-black/55 mt-0.5">{p.stack}</div>
                                        <ul className="mt-2 text-sm text-black/70 list-disc pl-5 space-y-1">
                                            {p.bullets.map((b, i) => (
                                                <li key={i}>{b}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section
                            title="Publications & Conferences"
                            hint=""
                            open={openKey === "pubs"}
                            onToggle={() => setOpenKey(openKey === "pubs" ? "" : "pubs")}
                        >
                            <div className="space-y-3">
                                {publications.map((p, i) => (
                                    <div key={i} className="pb-3 border-b border-black/10 last:border-b-0 text-sm text-black/75">
                                        {p.citation}
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section
                            title="Skills"
                            hint="Languages, ML, infra, tools, lab"
                            open={openKey === "skills"}
                            onToggle={() => setOpenKey(openKey === "skills" ? "" : "skills")}
                        >
                            <ul className="text-sm text-black/75 list-disc pl-5 space-y-1">
                                {skills.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </Section>

                        <div className="pt-6 text-[11px] text-black/55 flex items-center justify-between border-t border-black/10">
                            <div>
                                © {new Date().getFullYear()} {profile.name}
                            </div>
                            <div className="flex gap-3">
                                <a className="hover:text-black" href={`mailto:${profile.email}`}>
                                    Email
                                </a>
                                <a
                                    className="hover:text-black underline underline-offset-4"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openModal("experience");
                                    }}
                                >
                                    Full CV
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modal (also no box) */}
            <Modal open={modal === "experience"} title="Experience" onClose={closeModal}>
                <div className="space-y-6">
                    {experience.map((e) => (
                        <div key={e.org} className="pb-6 border-b border-black/10 last:border-b-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div className="text-sm font-semibold">{e.org}</div>
                                <div className="text-xs text-black/55">
                                    {e.dates} · {e.where}
                                </div>
                            </div>
                            <ul className="mt-2 text-sm text-black/75 list-disc pl-5 space-y-1.5">
                                {e.bullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
